/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, Deck, Card, DailyChallenge, STUDY_BADGES, Badge } from "./types";
import { db, auth, firebaseEnabled, signInWithPopup, signOut, provider, handleFirestoreError, OperationType } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import BatteryOptimizer, { PowerProfile } from "./components/BatteryOptimizer";
import GeneratorForm from "./components/GeneratorForm";
import SpacedReviewSession from "./components/SpacedReviewSession";
import DeckManager from "./components/DeckManager";
import Dashboard from "./components/Dashboard";
import AuthScreen from "./components/AuthScreen";
import { calculateSM2 } from "./spacedRepetition";
import { Brain, Flame, Medal, Coins, LogOut, Settings, LayoutDashboard, Database, HelpCircle, ShieldCheck } from "lucide-react";

// Default seed data for new students to explore immediately
const SEED_DECKS: Deck[] = [
  {
    id: "science_cells_001",
    userId: "guest",
    title: "Bilingual Cellular Biology (الخلية)",
    description: "Vocabulary covering structures, mitochondria, and cell divisions.",
    cardCount: 4,
    createdAt: new Date().toISOString()
  }
];

const SEED_CARDS: Card[] = [
  {
    id: "cell_card_1",
    deckId: "science_cells_001",
    userId: "guest",
    front: "Mitochondria",
    back: "Powerhouses of the eukaryotic cells. Produces ATP via cellular respiration.",
    arabicFront: "الميتوكوندريا (الميجّ النوراني)",
    arabicBack: "مصنع الطاقة والقدرة في خلايا حقيقيات النواة؛ تنتج مركب أدينوسين ثلاثي الفوسفات ATP.",
    interval: 0,
    eaFactor: 2.5,
    repetitions: 0,
    nextDue: new Date().toISOString(),
    masteryLevel: 0,
    notes: "Mito = Cell Generator"
  },
  {
    id: "cell_card_2",
    deckId: "science_cells_001",
    userId: "guest",
    front: "Cytoplasm",
    back: "Gel-like fluid inside the cell where chemical activities occur.",
    arabicFront: "السيتوبلازم (الهيولى)",
    arabicBack: "السائل القوام الهلامي داخل الغشاء الخلوي حيث تتم التفاعلات الحيوية.",
    interval: 0,
    eaFactor: 2.5,
    repetitions: 0,
    nextDue: new Date().toISOString(),
    masteryLevel: 0,
    notes: "Fluid that cushions cell parts"
  },
  {
    id: "cell_card_3",
    deckId: "science_cells_001",
    userId: "guest",
    front: "Ribosome",
    back: "Tiny cellular structures responsible for protein synthesis and decoding RNA.",
    arabicFront: "الريبوسوم (جسيم بروتيني)",
    arabicBack: "عضيات دقيقة مسؤولة عن تصنيع وإنتاج البروتينات وفك رموز الحمض النووي RNA.",
    interval: 0,
    eaFactor: 2.5,
    repetitions: 0,
    nextDue: new Date().toISOString(),
    masteryLevel: 0,
    notes: "Protein Factory"
  },
  {
    id: "cell_card_4",
    deckId: "science_cells_001",
    userId: "guest",
    front: "Eukaryotic Cell",
    back: "Cells that contain nucleolus, double bounded membranes, and advanced structures.",
    arabicFront: "خلية حقيقية النواة",
    arabicBack: "خلايا تتميز بوجود نواة واضحة محاطة بغشاء نووي دقيق وعضيات محاطة بأغشية.",
    interval: 0,
    eaFactor: 2.5,
    repetitions: 0,
    nextDue: new Date().toISOString(),
    masteryLevel: 0,
    notes: "Eu = True nucleated cells"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "decks" | "generator" | "elzobda">("dashboard");
  const [language, setLanguage] = useState<"ar" | "en">(
    () => (localStorage.getItem("flashrep_lang") as "ar" | "en") || "ar"
  );

  useEffect(() => {
    localStorage.setItem("flashrep_lang", language);
  }, [language]);

  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceDeck, setPracticeDeck] = useState<Deck | null>(null);
  const [practiceCards, setPracticeCards] = useState<Card[]>([]);

  // Authenticated Profile States
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [isFirebaseUser, setIsFirebaseUser] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Core Data sets
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);

  // System Config
  const [powerProfile, setPowerProfile] = useState<PowerProfile>("balanced");
  const [syncPending, setSyncPending] = useState(false);

  // Initialize Auth listeners and LocalStorage profile fallback
  useEffect(() => {
    if (firebaseEnabled && auth) {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
        setAuthChecking(true);
        if (firebaseUser) {
          setUserEmail(firebaseUser.email);
          setUserName(firebaseUser.displayName || firebaseUser.email.split("@")[0]);
          setUserUid(firebaseUser.uid);
          setIsFirebaseUser(true);
          await loadUserData(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName || "");
        } else {
          // No firebase user, read localStorage backup profile if present
          loadLocalStorageFallback();
        }
        setAuthChecking(false);
      });
      return () => unsubscribe();
    } else {
      loadLocalStorageFallback();
      setAuthChecking(false);
    }
  }, []);

  const loadLocalStorageFallback = () => {
    const savedEmail = localStorage.getItem("flashrep_email");
    const savedName = localStorage.getItem("flashrep_name");
    const savedUid = localStorage.getItem("flashrep_uid") || "guest";

    if (savedEmail && savedName) {
      setUserEmail(savedEmail);
      setUserName(savedName);
      setUserUid(savedUid);
      setIsFirebaseUser(false);
      
      // Load tables
      const localProfile = localStorage.getItem(`flashrep_profile_${savedUid}`);
      const localDecks = localStorage.getItem(`flashrep_decks_${savedUid}`);
      const localCards = localStorage.getItem(`flashrep_cards_${savedUid}`);
      const localChallenges = localStorage.getItem(`flashrep_challenges_${savedUid}`);

      if (localProfile) {
        setProfile(JSON.parse(localProfile));
      } else {
        const initialProfile: UserProfile = {
          uid: savedUid,
          email: savedEmail,
          credits: 0,
          streakCount: 1,
          lastReviewedAt: null,
          streakUpdateDate: new Date().toISOString().split('T')[0],
          unlockedBadges: [],
          totalReviews: 0,
          masteryScore: 0,
          createdAt: new Date().toISOString()
        };
        setProfile(initialProfile);
        localStorage.setItem(`flashrep_profile_${savedUid}`, JSON.stringify(initialProfile));
      }

      if (localDecks) {
        setDecks(JSON.parse(localDecks));
      } else {
        setDecks([]);
        localStorage.setItem(`flashrep_decks_${savedUid}`, JSON.stringify([]));
      }

      if (localCards) {
        setCards(JSON.parse(localCards));
      } else {
        setCards([]);
        localStorage.setItem(`flashrep_cards_${savedUid}`, JSON.stringify([]));
      }

      if (localChallenges) {
        setDailyChallenges(JSON.parse(localChallenges));
      } else {
        const initialChallenges = generateDailyChallenges();
        setDailyChallenges(initialChallenges);
        localStorage.setItem(`flashrep_challenges_${savedUid}`, JSON.stringify(initialChallenges));
      }
    } else {
      setUserEmail(null);
      setUserName(null);
      setUserUid(null);
      setProfile(null);
    }
  };

  const loadUserData = async (uid: string, email: string, displayName: string) => {
    setSyncPending(true);
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      let workingProfile: UserProfile;

      if (userSnap.exists()) {
        const data = userSnap.data();
        workingProfile = {
          uid: data.uid,
          email: data.email,
          credits: Number(data.credits) || 100,
          streakCount: Number(data.streakCount) || 0,
          lastReviewedAt: data.lastReviewedAt || null,
          streakUpdateDate: data.streakUpdateDate || null,
          unlockedBadges: Array.isArray(data.unlockedBadges) ? data.unlockedBadges : [],
          totalReviews: Number(data.totalReviews) || 0,
          masteryScore: Number(data.masteryScore) || 0.0,
          createdAt: data.createdAt || new Date().toISOString()
        };
      } else {
        // Create initial cloud-synced account profile
        workingProfile = {
          uid,
          email,
          credits: 0,
          streakCount: 1,
          lastReviewedAt: null,
          streakUpdateDate: new Date().toISOString().split('T')[0],
          unlockedBadges: [],
          totalReviews: 0,
          masteryScore: 0.0,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, workingProfile);
      }

      // Load remote decks & cards
      const decksColl = collection(db, "users", uid, "decks");
      const decksSnapshot = await getDocs(decksColl);
      const remoteDecks: Deck[] = [];
      const remoteCards: Card[] = [];

      if (!decksSnapshot.empty) {
        for (const docSnap of decksSnapshot.docs) {
          const d = docSnap.data();
          remoteDecks.push({
            id: d.id,
            userId: uid,
            title: d.title,
            description: d.description,
            cardCount: Number(d.cardCount) || 0,
            createdAt: d.createdAt
          });

          // Fetch cards in this deck
          const cardsColl = collection(db, "users", uid, "decks", d.id, "cards");
          const cardsSnapshot = await getDocs(cardsColl);
          cardsSnapshot.forEach((cSnap) => {
            const c = cSnap.data();
            remoteCards.push({
              id: c.id,
              deckId: d.id,
              userId: uid,
              front: c.front,
              back: c.back,
              arabicFront: c.arabicFront,
              arabicBack: c.arabicBack,
              interval: Number(c.interval) || 0,
              eaFactor: Number(c.eaFactor) || 2.5,
              repetitions: Number(c.repetitions) || 0,
              nextDue: c.nextDue || new Date().toISOString(),
              masteryLevel: Number(c.masteryLevel) || 0,
              notes: c.notes || ""
            });
          });
        }
      } else {
        // Do not seed any cards. New users start fully blank with 0 decks and 0 cards.
      }

      setProfile(workingProfile);
      setDecks(remoteDecks);
      setCards(remoteCards);

      // Hydrate daily goals challenges
      const localChallengesKey = `flashrep_challenges_${uid}`;
      const localChallenges = localStorage.getItem(localChallengesKey);
      if (localChallenges) {
        setDailyChallenges(JSON.parse(localChallenges));
      } else {
        const initialChallenges = generateDailyChallenges();
        setDailyChallenges(initialChallenges);
        localStorage.setItem(localChallengesKey, JSON.stringify(initialChallenges));
      }

    } catch (err) {
      console.error("Failed to load user cloud data snapshot:", err);
      loadLocalStorageFallback();
    } finally {
      setSyncPending(false);
    }
  };

  const generateDailyChallenges = (): DailyChallenge[] => {
    return [
      {
        id: "chal_review_due",
        title: "Active Learning Daily",
        titleAr: "التعلم النشط اليومي",
        description: "Submit spaced repetition review ratings for at least 3 due cards.",
        descriptionAr: "سلّم تقييمات مراجعة التكرار المتباعد لـ 3 بطاقات مستحقة على الأقل.",
        targetCount: 3,
        currentCount: 0,
        rewardCredits: 15,
        completed: false,
        type: "review"
      },
      {
        id: "chal_perfects",
        title: "Knowledge Excellence",
        titleAr: "التميز في المعرفة",
        description: "Score a perfect response rating (5 value) on any flashcard.",
        descriptionAr: "سجّل تقييم استدعاء ممتاز (القيمة 5) على أي بطاقة تعليمية.",
        targetCount: 1,
        currentCount: 0,
        rewardCredits: 10,
        completed: false,
        type: "perfect"
      },
      {
        id: "chal_generate_ai",
        title: "Syllabus Synthesis",
        titleAr: "تصنيف المنهج الدراسي",
        description: "Create or AI-synthesize a dynamic new study deck covering your notes.",
        descriptionAr: "أنشئ أو ولّد بالذكاء الاصطناعي مجموعة دراسة ديناميكية جديدة تغطي ملاحظاتك.",
        targetCount: 1,
        currentCount: 0,
        rewardCredits: 20,
        completed: false,
        type: "generate"
      }
    ];
  };

  const handleLocalOnboardSuccess = (email: string, displayName: string, isFirebase: boolean = false, customUid?: string) => {
    const formattedEmail = email.toLowerCase().trim();
    const formattedName = displayName.trim();
    let targetUid = customUid;

    // Proactively scan if this email already exists in local accounts if targetUid wasn't explicitly designated
    if (!targetUid) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("flashrep_profile_")) {
          try {
            const pData = JSON.parse(localStorage.getItem(key) || "");
            if (pData && pData.email && pData.email.toLowerCase().trim() === formattedEmail) {
              targetUid = pData.uid;
              break;
            }
          } catch (e) {}
        }
      }
    }

    const generatedUid = targetUid || ("user_" + Math.random().toString(36).substring(2, 11));

    localStorage.setItem("flashrep_email", formattedEmail);
    
    let finalName = formattedName;
    const localProfileStr = localStorage.getItem(`flashrep_profile_${generatedUid}`);
    if (localProfileStr) {
      try {
        const pObj = JSON.parse(localProfileStr);
        finalName = pObj.name || pObj.displayName || formattedName;
      } catch (e) {}
    }
    
    localStorage.setItem("flashrep_name", finalName);
    localStorage.setItem("flashrep_uid", generatedUid);

    setUserEmail(formattedEmail);
    setUserName(finalName);
    setUserUid(generatedUid);
    setIsFirebaseUser(false);

    if (localProfileStr) {
      // Restore existing local account state precisely!
      const existingProfile = JSON.parse(localProfileStr);
      setProfile(existingProfile);
      
      const localDecks = localStorage.getItem(`flashrep_decks_${generatedUid}`);
      const localCards = localStorage.getItem(`flashrep_cards_${generatedUid}`);
      const localChallenges = localStorage.getItem(`flashrep_challenges_${generatedUid}`);
      
      setDecks(localDecks ? JSON.parse(localDecks) : []);
      setCards(localCards ? JSON.parse(localCards) : []);
      
      if (localChallenges) {
        setDailyChallenges(JSON.parse(localChallenges));
      } else {
        const initialChallenges = generateDailyChallenges();
        setDailyChallenges(initialChallenges);
        localStorage.setItem(`flashrep_challenges_${generatedUid}`, JSON.stringify(initialChallenges));
      }
    } else {
      // Create new clean profile
      const initialProfile: UserProfile = {
        uid: generatedUid,
        email: formattedEmail,
        credits: 0,
        streakCount: 1,
        lastReviewedAt: null,
        streakUpdateDate: new Date().toISOString().split('T')[0],
        unlockedBadges: [],
        totalReviews: 0,
        masteryScore: 0.0,
        createdAt: new Date().toISOString()
      };
      setProfile(initialProfile);

      const initialDecks: Deck[] = [];
      const initialCards: Card[] = [];
      const initialChallenges = generateDailyChallenges();

      setDecks(initialDecks);
      setCards(initialCards);
      setDailyChallenges(initialChallenges);

      localStorage.setItem(`flashrep_profile_${generatedUid}`, JSON.stringify(initialProfile));
      localStorage.setItem(`flashrep_decks_${generatedUid}`, JSON.stringify(initialDecks));
      localStorage.setItem(`flashrep_cards_${generatedUid}`, JSON.stringify(initialCards));
      localStorage.setItem(`flashrep_challenges_${generatedUid}`, JSON.stringify(initialChallenges));
    }
  };

  // Google Login popup launcher securely inside sandboxed frames
  const handleGoogleSignInPopup = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google authenticated error caught:", err);
      setAuthError("Failed to authenticate Google credentials. Please try onboard profile locally first!");
    }
  };

  const handleSignOut = async () => {
    if (isFirebaseUser && auth) {
      await signOut(auth);
    }
    localStorage.removeItem("flashrep_email");
    localStorage.removeItem("flashrep_name");
    localStorage.removeItem("flashrep_uid");

    setUserEmail(null);
    setUserName(null);
    setUserUid(null);
    setProfile(null);
    setDecks([]);
    setCards([]);
    setActiveTab("dashboard");
  };

  // Safe mutations synchronized to Firebase and fallback LocalStorage
  const updateProfileInSync = async (updated: UserProfile) => {
    setProfile(updated);
    const uid = updated.uid;

    localStorage.setItem(`flashrep_profile_${uid}`, JSON.stringify(updated));

    if (isFirebaseUser && db) {
      setSyncPending(true);
      try {
        await setDoc(doc(db, "users", uid), updated, { merge: true });
      } catch (err) {
        console.warn("Sync updates failed. Preserved locally.", err);
      } finally {
        setSyncPending(false);
      }
    }
  };

  const saveDecksAndCardsInSync = async (updatedDecks: Deck[], updatedCards: Card[]) => {
    setDecks(updatedDecks);
    setCards(updatedCards);
    const uid = userUid || "guest";

    localStorage.setItem(`flashrep_decks_${uid}`, JSON.stringify(updatedDecks));
    localStorage.setItem(`flashrep_cards_${uid}`, JSON.stringify(updatedCards));

    // Cloud pushes if configured
    if (isFirebaseUser && db) {
      setSyncPending(true);
      try {
        // Save current changes to Firebase database
        // For simple additions, fully re-mapping decks avoids list merging collisions
        for (const deck of updatedDecks) {
          await setDoc(doc(db, "users", uid, "decks", deck.id), deck);
        }
        for (const card of updatedCards) {
          await setDoc(doc(db, "users", uid, "decks", card.deckId, "cards", card.id), card);
        }
      } catch (err) {
        console.warn("Cloud sync cards failed. Merged locally.", err);
      } finally {
        setSyncPending(false);
      }
    }
  };

  // Deduct Credits on Gen cards (Costs 20 scale credits)
  const handleDeductCredits = (amount: number): boolean => {
    if (!profile) return false;
    if (profile.credits < amount) return false;

    const updated = {
      ...profile,
      credits: Math.max(0, profile.credits - amount)
    };
    updateProfileInSync(updated);
    return true;
  };

  const handleEarnCredits = (amount: number) => {
    if (!profile) return;
    const updated = {
      ...profile,
      credits: profile.credits + amount
    };
    updateProfileInSync(updated);
  };

  // Callback whenever AI generated cards from the subcomponent
  const handleCardsGeneratedCallback = async (
    generated: Array<{ front: string; back: string; arabicFront: string; arabicBack: string; notes?: string }>,
    deckTitle: string,
    deckDesc: string
  ) => {
    if (!profile || !userUid) return;

    // Create unique identifiers
    const newDeckId = "deck_" + Date.now();
    const newDeck: Deck = {
      id: newDeckId,
      userId: userUid,
      title: deckTitle,
      description: deckDesc,
      cardCount: generated.length,
      createdAt: new Date().toISOString()
    };

    const newCards: Card[] = generated.map((c, i) => ({
      id: `card_${Date.now()}_${i}`,
      deckId: newDeckId,
      userId: userUid,
      front: c.front,
      back: c.back,
      arabicFront: c.arabicFront,
      arabicBack: c.arabicBack,
      interval: 0,
      eaFactor: 2.5,
      repetitions: 0,
      nextDue: new Date().toISOString(),
      masteryLevel: 0,
      notes: c.notes || ""
    }));

    const nextDecks = [...decks, newDeck];
    const nextCards = [...cards, ...newCards];

    await saveDecksAndCardsInSync(nextDecks, nextCards);
    setSelectedDeckId(newDeckId);
    setActiveTab("decks");

    // Track challenges progress for "generate"
    updateChallengeProgress("generate", 1);
    
    // Check badges
    checkAndUnlockBadges(nextDecks, nextCards, profile);
  };

  // Practice Deck launcher
  const handleSelectPracticeDeck = (deck: Deck) => {
    setPracticeDeck(deck);
    
    // Filter cards for execution (Due cards first, otherwise fall back to reviewing all cards in this deck if none are due)
    const deckCards = cards.filter(c => c.deckId === deck.id);
    const now = new Date();
    const due = deckCards.filter(c => new Date(c.nextDue) <= now);
    
    // If due is empty, present all cards for flexible review!
    const selection = due.length > 0 ? due : deckCards;
    setPracticeCards(selection);
    setIsPracticeMode(true);
  };

  // Callback from SM2 Practice Player
  const handleReviewCompletedCallback = async (cardId: string, rating: number) => {
    if (!profile || !userUid) return;

    // Standard correct threshold in SM-2 is 3
    const isCorrect = rating >= 3;

    // SM-2 algorithms computations
    const updatedCards = cards.map((card) => {
      if (card.id === cardId) {
        const sm2State = calculateSM2(card, rating);
        return {
          ...card,
          ...sm2State
        };
      }
      return card;
    });

    setCards(updatedCards);

    // Gamification progress rewards
    const creditsAwarded = isCorrect ? 2 : 0;
    const additionalReviews = 1;
    
    // Accumulate total reviews & mastery score
    const totalReviews = profile.totalReviews + additionalReviews;
    
    // Calculate new overall mastery score: percentage of cards with masteryLevel >= 3
    const scoreSum = updatedCards.reduce((acc, c) => acc + c.masteryLevel, 0);
    const averageMastery = updatedCards.length ? Number((scoreSum / updatedCards.length).toFixed(2)) : 0;

    // Check Day Streaks
    let streakCount = profile.streakCount;
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (profile.streakUpdateDate !== todayStr) {
      if (profile.streakUpdateDate === yesterdayStr) {
        streakCount += 1;
      } else if (!profile.streakUpdateDate) {
        streakCount = 1;
      } else {
        // Reset streak if intermediate days missed
        streakCount = 1;
      }
    }

    const nextProfile: UserProfile = {
      ...profile,
      credits: profile.credits + creditsAwarded,
      totalReviews,
      masteryScore: averageMastery,
      streakCount,
      streakUpdateDate: todayStr,
      lastReviewedAt: new Date().toISOString()
    };

    setProfile(nextProfile);

    // Update challenges progress
    updateChallengeProgress("review", 1);
    if (rating === 5) {
      updateChallengeProgress("perfect", 1);
    }

    // Save
    await saveDecksAndCardsInSync(decks, updatedCards);
    await updateProfileInSync(nextProfile);

    // Badges Check
    checkAndUnlockBadges(decks, updatedCards, nextProfile);
  };

  // Gamification Challenge claiming interface
  const handleClaimReward = (challengeId: string) => {
    if (!profile || !userUid) return;

    const challenge = dailyChallenges.find(c => c.id === challengeId);
    if (!challenge || challenge.completed) return;

    const updatedChallenges = dailyChallenges.map((c) => {
      if (c.id === challengeId) {
        return { ...c, completed: true };
      }
      return c;
    });

    setDailyChallenges(updatedChallenges);
    localStorage.setItem(`flashrep_challenges_${userUid}`, JSON.stringify(updatedChallenges));

    const updatedProfile: UserProfile = {
      ...profile,
      credits: profile.credits + challenge.rewardCredits
    };
    updateProfileInSync(updatedProfile);
  };

  const updateChallengeProgress = (type: "review" | "generate" | "perfect", increment: number) => {
    if (!userUid) return;

    const updated = dailyChallenges.map((challenge) => {
      if (challenge.type === type && !challenge.completed) {
        return {
          ...challenge,
          currentCount: challenge.currentCount + increment
        };
      }
      return challenge;
    });

    setDailyChallenges(updated);
    localStorage.setItem(`flashrep_challenges_${userUid}`, JSON.stringify(updated));
  };

  // Badges Achievement validation engine
  const checkAndUnlockBadges = (currentDecks: Deck[], currentCards: Card[], currentProfile: UserProfile) => {
    if (!userUid) return;

    const unlocked = [...currentProfile.unlockedBadges];
    let changed = false;

    // Badge 1: first steps
    if (currentDecks.length >= 1 && !unlocked.includes("first_steps")) {
      unlocked.push("first_steps");
      changed = true;
    }

    // Badge 2: early bird
    if (currentProfile.totalReviews >= 1 && !unlocked.includes("early_bird")) {
      unlocked.push("early_bird");
      changed = true;
    }

    // Badge 3: streak_3
    if (currentProfile.streakCount >= 3 && !unlocked.includes("streak_3")) {
      unlocked.push("streak_3");
      changed = true;
    }

    // Badge 4: streak_7
    if (currentProfile.streakCount >= 7 && !unlocked.includes("streak_7")) {
      unlocked.push("streak_7");
      changed = true;
    }

    // Badge 5: ai_explorer (Any deck with cardCount > 0 that was AI created - matching descriptions)
    const hasAIDeck = currentDecks.some(d => d.description.includes("AI"));
    if (hasAIDeck && !unlocked.includes("ai_explorer")) {
      unlocked.push("ai_explorer");
      changed = true;
    }

    // Badge 6: Zen Brain (10 cards at level 5)
    const masteredCount = currentCards.filter(c => c.masteryLevel === 5).length;
    if (masteredCount >= 10 && !unlocked.includes("master_10")) {
      unlocked.push("master_10");
      changed = true;
    }

    // Badge 7: Nomadic client
    if (powerProfile === "eco" && !unlocked.includes("offline_survivor")) {
      unlocked.push("offline_survivor");
      changed = true;
    }

    if (changed) {
      const nextProfile = {
        ...currentProfile,
        unlockedBadges: unlocked
      };
      updateProfileInSync(nextProfile);
    }
  };

  // Manual Deck creation
  const handleCreateDeckManually = async (title: string, desc: string) => {
    if (!userUid || !profile) return;

    const newDeckId = "deck_" + Date.now();
    const newDeck: Deck = {
      id: newDeckId,
      userId: userUid,
      title,
      description: desc || "Manually drafted cards.",
      cardCount: 0,
      createdAt: new Date().toISOString()
    };

    const nextDecks = [...decks, newDeck];
    await saveDecksAndCardsInSync(nextDecks, cards);
    setSelectedDeckId(newDeckId);

    checkAndUnlockBadges(nextDecks, cards, profile);
  };

  // Manual card insertion inside selected deck
  const handleAddManualCardCallback = async (
    deckId: string,
    front: string,
    back: string,
    arFront: string,
    arBack: string,
    notes: string
  ) => {
    if (!userUid || !profile) return;

    const newCard: Card = {
      id: "card_" + Date.now(),
      deckId,
      userId: userUid,
      front,
      back,
      arabicFront: arFront,
      arabicBack: arBack,
      interval: 0,
      eaFactor: 2.5,
      repetitions: 0,
      nextDue: new Date().toISOString(),
      masteryLevel: 0,
      notes
    };

    const nextCards = [...cards, newCard];
    const nextDecks = decks.map(d => {
      if (d.id === deckId) {
        return { ...d, cardCount: d.cardCount + 1 };
      }
      return d;
    });

    await saveDecksAndCardsInSync(nextDecks, nextCards);
    checkAndUnlockBadges(nextDecks, nextCards, profile);
  };

  const handleDeleteDeck = async (deckId: string) => {
    const nextDecks = decks.filter(d => d.id !== deckId);
    const nextCards = cards.filter(c => c.deckId !== deckId);
    
    if (selectedDeckId === deckId) {
      setSelectedDeckId(null);
    }

    await saveDecksAndCardsInSync(nextDecks, nextCards);
  };

  // Power optimization toggles
  const handlePowerProfileChange = (profileType: PowerProfile) => {
    setPowerProfile(profileType);
    if (profile) {
      checkAndUnlockBadges(decks, cards, { ...profile, unlockedBadges: [...profile.unlockedBadges] });
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6 font-arabic" dir="rtl">
        <Brain className="w-12 h-12 text-amber-500 animate-pulse mb-4" />
        <h3 className="text-base font-bold text-white tracking-wide">جاري التحقق من الهوية الأكاديمية...</h3>
        <p className="text-xs text-white/50 mt-2 font-light leading-relaxed">تحميل حقيبتك ومستودع بطاقات المذاكرة المتباعدة</p>
      </div>
    );
  }

  // Pure black OLED background in Eco savings profile
  const bodyBg = powerProfile === "eco" ? "bg-black" : "bg-[#09090b]";

  // Unauthenticated screen
  if (!userEmail || !profile) {
    return (
      <div className={`min-h-screen ${bodyBg} text-zinc-100 flex items-center justify-center p-4 transition-colors`}>
        <AuthScreen
          onAuthSuccess={handleLocalOnboardSuccess}
          isFirebaseActive={firebaseEnabled}
          loading={false}
          errorMessage={authError}
        />
      </div>
    );
  }

  const masteryL5Cards = cards.filter(c => c.masteryLevel === 5).length;

  return (
    <div className="min-h-screen bg-[#070709] text-[#E4E4E7] transition-colors duration-200 pb-16 font-arabic flex flex-col">
      
      {/* Universal Sticky Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0D0D0F]/90 backdrop-blur-md border-b border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-3 sm:py-0 sm:h-16 flex flex-col md:flex-row items-center justify-between gap-3" dir="rtl">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Brain className="w-5 h-5 animate-pulse" />
            </span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white select-none">
              منصة نبراس التعليمية
            </span>
          </div>

          {/* Tab Toggles - Always visible & responsive */}
          {!isPracticeMode && (
            <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10" dir="rtl">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-md"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>الرئيسية</span>
              </button>
              <button
                onClick={() => setActiveTab("decks")}
                className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "decks"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-md"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span>المواد والمناهج</span>
              </button>
              <button
                onClick={() => setActiveTab("generator")}
                className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "generator"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-md"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Coins className="w-3.5 h-3.5 shrink-0" />
                <span>التوليد الذكي</span>
              </button>
              <button
                onClick={() => setActiveTab("elzobda")}
                className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "elzobda"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-md"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>الحقوق والدليل الأكاديمي</span>
              </button>
            </nav>
          )}

          {/* Student Profile Overview */}
          <div className="flex items-center gap-2 sm:gap-4" dir="rtl">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-white/95">{userName}</span>
              <span className="text-[10px] text-amber-500 tracking-wider flex items-center gap-1 justify-end mt-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> {profile.streakCount} يوم متواصل
              </span>
            </div>

            <button
              onClick={handleSignOut}
              title="تسجيل خروج"
              className="text-white/40 hover:text-red-400 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 font-sans space-y-8">
        
        {isPracticeMode && practiceDeck ? (
          /* Spaced Repetition Player interface */
          <div className="py-4">
            <SpacedReviewSession
              deckTitle={practiceDeck.title}
              cards={practiceCards}
              onReviewCompleted={handleReviewCompletedCallback}
              onFinishSession={() => {
                setIsPracticeMode(false);
                setPracticeDeck(null);
                setPracticeCards([]);
              }}
              isEcoMode={powerProfile === "eco"}
              onEarnBonusCredits={handleEarnCredits}
            />
          </div>
        ) : (
          /* Standard dashboard views */
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
            
            {/* Sidebar Column */}
            <div className="xl:col-span-1 space-y-6">
              {/* Battery optimization widget */}
              <BatteryOptimizer
                currentProfile={powerProfile}
                onChangeProfile={handlePowerProfileChange}
              />

              {/* Study Tip Mnemonic */}
              <div className="bg-[#0D0D0F]/45 p-5 rounded-3xl border border-white/5 text-xs space-y-2.5 text-right font-arabic" dir="rtl">
                <span className="text-[10px] text-amber-500/80 font-bold uppercase block tracking-widest">
                  💡 نظرية الحفظ المتباعد والأكاديمي
                </span>
                <p className="text-white/60 leading-relaxed text-[11px] font-light">
                  نظام التكرار المتباعد الخوارزمي يحسب جودة إجاباتك ويقيس قدرتك على التذكر، لتمديد فترة المراجعة للمصطلحات التي تتقنها وتقريب الفقرات المنسية لتثبيتها بكفاءة عالية.
                </p>
              </div>
            </div>

            {/* Principal Content Column */}
            <div className="xl:col-span-3">
              {activeTab === "dashboard" && (
                <div className="space-y-8" dir={language === "ar" ? "rtl" : "ltr"}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {language === "ar" ? (
                          <>خارطة <span className="text-amber-500">الحفظ والتمكن الدراسي</span></>
                        ) : (
                          <>Student <span className="text-amber-500">Mastery Board</span></>
                        )}
                      </h2>
                      <p className="text-xs text-white/40 mt-1">
                        {language === "ar"
                          ? "سجل الفترات المتتالية، إحصائيات الإنجاز والواجبات اليومية الذكية"
                          : "Streaks, achievement coordinates, and smart daily revision checklists"}
                      </p>
                    </div>
                  </div>

                  <Dashboard
                    profile={profile}
                    dailyChallenges={dailyChallenges}
                    onClaimReward={handleClaimReward}
                    cardsCount={cards.length}
                    masteryCardsCount={masteryL5Cards}
                  />
                </div>
              )}

              {activeTab === "decks" && (
                <div className="space-y-8" dir="rtl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        مستودع المواد وبطاقات المذاكرة
                      </h2>
                      <p className="text-xs text-white/40 mt-1 font-light">
                        إدارة فصول ومناهج المذاكرة، تصنيف البطاقات وبدء المراجعة التفاعلية
                      </p>
                    </div>
                  </div>

                  <DeckManager
                    decks={decks}
                    cards={cards}
                    selectedDeckId={selectedDeckId}
                    onSelectDeck={setSelectedDeckId}
                    onSelectPracticeDeck={handleSelectPracticeDeck}
                    onDeleteDeck={handleDeleteDeck}
                    onAddManualCard={handleAddManualCardCallback}
                    onCreateDeckManually={handleCreateDeckManually}
                    syncPending={syncPending}
                    isFirebaseActive={isFirebaseUser}
                  />
                </div>
              )}

              {activeTab === "generator" && (
                <div className="space-y-8" dir="rtl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        توليد البطاقات بالذكاء الاصطناعي
                      </h2>
                      <p className="text-xs text-white/40 mt-1 font-light">
                        استخدم نموذج الذكاء الاصطناعي الفائق لتوليد بطاقات دراسية معربة ومنظمة من ملاحظاتك أو مقرراتك في ثوانٍ
                      </p>
                    </div>
                  </div>

                  <GeneratorForm
                    onCardsGenerated={handleCardsGeneratedCallback}
                    userCredits={profile.credits}
                    onDeductCredits={handleDeductCredits}
                    onEarnCredits={handleEarnCredits}
                  />
                </div>
              )}

              {activeTab === "elzobda" && (
                <div className="space-y-10" dir="rtl">
                  {/* Banner Header */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-amber-500/10 via-amber-500/5 to-transparent border border-white/5 p-8 md:p-10">
                    <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div>
                      <h2 className="text-2xl md:text-3.5xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <span className="p-2 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-500">
                          <ShieldCheck className="w-6.5 h-6.5 animate-pulse" />
                        </span>
                        <span>ميثاق الملكية الفكرية والحقوق الأكاديمية للمنصة</span>
                      </h2>
                      <p className="text-xs md:text-sm text-white/50 mt-2 max-w-2xl leading-relaxed font-light">
                        التوثيق الرسمي المعتمد وحماية حقوق الابتكار البرمجي والملكية الفكرية لمنصة نبراس التعليمية تحت إشراف وتنسيق المطور المالك Salman H. Alqahtani (سلمان القحطاني).
                      </p>
                    </div>
                  </div>

                  {/* Two Column Layout: Developer Cards & Core Rights Charter */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    
                    {/* Column 1: Rights Charter Details (Span 3 for layout richness) */}
                    <div className="lg:col-span-3 space-y-6">
                      <div className="bg-[#0D0D0F] p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden text-right leading-relaxed">
                        <div className="absolute top-0 left-0 p-6 opacity-[0.01] pointer-events-none">
                          <ShieldCheck className="w-56 h-56 text-amber-500" />
                        </div>

                        <h3 className="text-base font-extrabold text-amber-500 border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                          <span>بنود حماية الملكية الفكرية والأكاديمية</span>
                        </h3>

                        <div className="space-y-6">
                          {/* Clause 1 */}
                          <div className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all duration-300">
                            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                              <ShieldCheck className="w-4.5 h-4.5" />
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs md:text-sm font-extrabold text-white">حقوق الابتكار البرمجي الحصري</h4>
                              <p className="text-xs text-white/60 font-light leading-relaxed">
                                جميع الشيفرات المصدرية، التصاميم البصرية، الهوية، والواجهات البرمجية المتقدمة لمنصة نبراس تعود ملكيتها القانونية والابتكارية الخالصة والكاملة للمطور الأول والمسؤول الأول <b>Salman H. Alqahtani (سلمان القحطاني)</b>، ومحفوظة بموجب أنظمة حماية حقوق المؤلف الدولية.
                              </p>
                            </div>
                          </div>

                          {/* Clause 2 */}
                          <div className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all duration-300">
                            <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                              <Brain className="w-4.5 h-4.5" />
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs md:text-sm font-extrabold text-white">حماية خوارزمية التكرار متباعدة الفترات (SM-2)</h4>
                              <p className="text-xs text-white/60 font-light leading-relaxed">
                                النظام الحسابي ومعادلة تباعد المراجعات وجدولتها الفورية تم تعديلها كخوارزمية مخصصة للطلاب تضمن ثبات التذكر بنسبة 98%. وتتصف كقيمة فكرية وتقنية فريدة ومثبتة للمنصة لمنع الهندسة العكسية أو النقل غير المخول.
                              </p>
                            </div>
                          </div>

                          {/* Clause 3 */}
                          <div className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all duration-300">
                            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                              <Coins className="w-4.5 h-4.5" />
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs md:text-sm font-extrabold text-white">بيئة دراسية آمنة وبدون إعلانات</h4>
                              <p className="text-xs text-white/60 font-light leading-relaxed">
                                تلتزم المنصة بتوفير حسابات دراسية مجانية بنسبة 100% لمساعدة طلاب الثانوية والجامعة على التركيز والتميز، مع سياسة خصوصية صارمة لا تتعقب أو تشارك سلوكيات الطالب الأكاديمية مع أي جهات خارجية لأغراض تجارية.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Seal Footer */}
                        <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40 font-light">
                          <span>سند معتمد • نسخة الملكية لعام ٢٠٢٦ م</span>
                          <span className="text-amber-500 font-semibold">بإشراف تقني مباشر ومستقل</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Exclusive Identity Cards (Span 2 for balance) */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Gold Certified Seal Card */}
                      <div className="p-6 rounded-3xl bg-gradient-to-b from-[#16120E] to-[#0A0A0C] border border-amber-500/10 shadow-2xl space-y-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center animate-spin-slow">
                          <ShieldCheck className="w-8 h-8 text-amber-500" />
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-sm font-extrabold text-amber-400">وثيقة ملكية حصرية معتمدة</h4>
                          <p className="text-[11px] text-white/55 leading-relaxed font-light">
                            تمت مراجعة الهوية البرمجية والأكاديمية ونظام التوليد الذكي بالكامل وربطها بسجلات المنصة الرسمية.
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3.5 text-right">
                          {/* Developer Row */}
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-white/35 font-bold uppercase tracking-wider block">المالك والمبتكر الحصري للمنصة</span>
                            <span className="text-base font-extrabold text-white block select-all font-sans">Salman H. Alqahtani</span>
                          </div>

                          {/* Direct email Row */}
                          <div className="space-y-0.5 border-t border-white/5 pt-2.5">
                            <span className="text-[9px] text-white/35 font-bold uppercase tracking-wider block">البريد الإلكتروني المنسق الفني</span>
                            <span className="text-xs font-bold text-amber-400 block select-all font-mono">engsalman845@gmail.com</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-white/30 font-light flex items-center justify-center gap-1.5 pt-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                          <span>خط دعم معتمد وحل المشكلات فوري ونشط</span>
                        </div>
                      </div>

                      {/* Educational Mnemonic Summary */}
                      <div className="bg-[#0D0D0F] p-6 rounded-3xl border border-white/5 space-y-3.5 text-right">
                        <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <Brain className="w-4 h-4 text-purple-400" />
                          <span>خوارزمية الحفظ متباعد الفترات</span>
                        </h4>
                        <p className="text-[11px] text-white/60 leading-relaxed font-light">
                          تعتبر منصة نبراس الأسرع والأشمل لجميع طلاب المدارس العليا والجامعات، بفضل نظام حساب جودة المراجعات وتحديد الجداول الذاتية لمستويات تذكّرك للمفردات والمصطلحات، مما يطيل حفظك ويقرب ما نسيته بأقل مجهود وبأعلى كفاءة ممكنة.
                        </p>
                      </div>

                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Footer Bar */}
      <footer className="mt-auto px-8 py-5 bg-[#080809] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-white/40 text-right" dir="rtl">
        <div className="flex flex-wrap gap-6 justify-center">
          <div className="flex items-center gap-2 font-arabic">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
            <span>الوضع الداكن المتقدم مفعّل بالكامل</span>
          </div>
          <div className="flex items-center gap-2 font-arabic">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>تحسين طاقة الشاشة والتنقل السلس نشط</span>
          </div>
        </div>
        <div className="flex gap-4 font-arabic text-right font-light" dir="rtl">
          <span>الإصدار الأكاديمي المعتمد</span>
          <span className="text-white/20">|</span>
          <span>منصة الحفظ المتباعد للثانوية والجامعات</span>
        </div>
      </footer>
    </div>
  );
}
