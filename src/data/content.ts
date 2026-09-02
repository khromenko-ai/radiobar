export type Language = 'EN' | 'ES' | 'RU';

export interface Act {
  id: string;
  number: string;
  theme: string;
  title: string;
  instruction: string;
  dishName: string;
  dishDescription: string;
  image?: string;
}

export function getActImage(act: Act): string {
  if (act.image) return act.image;
  const num = parseInt(act.number, 10) || 1;
  if (act.id.startsWith('fd')) return `/food/first-date-${num}.jpg`;
  if (act.id.startsWith('bf')) return `/food/best-friends-${num}.jpg`;
  if (act.id.startsWith('rr')) return `/food/relation-reboost-${num}.jpg`;
  return `/food/first-date-1.jpg`;
}

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  introText: string;
  acts: Act[];
}

export const uiTranslations = {
  EN: {
    welcomeTitle: "YOUR EVENING\nBEGINS HERE.",
    welcomeSubtitle: "Choose the experience you want to share.",
    enter: "ENTER",
    pass: "PASS",
    nextMomentIn: "NEXT MOMENT IN",
    nextMoment: "NEXT MOMENT",
    waitFirstCourse: "WAIT FOR YOUR FIRST COURSE.",
    firstCourseReady: "YOUR FIRST COURSE IS READY.",
    welcomeBack: "WELCOME BACK.\nYOUR EVENING CONTINUES.",
    endTitle: "THE SEVEN MOMENTS ARE YOURS.",
    endSubtitle: "Stay as long as you like.",
    moments: "7 moments.\nOne evening.\nTwo people.",
    devMode: "DEV MODE: TIMERS SET TO 10s",
    minutes: "minutes",
    seconds: "seconds",
    infoTitle: "TONIGHT",
    infoDesc1: "This is not a dinner you simply watch.",
    infoDesc2: "It is a dinner you experience together.\nChoose an experience, follow the moments as they arrive, and let the evening unfold at its own pace.",
    howItWorks: "HOW IT WORKS",
    howItWorks1: "Choose one of the three experiences.",
    howItWorks2: "A new moment will appear with each course.",
    howItWorks3: "Read it together.\nThen put the phone down.\nThe dinner happens between you.",
    theDish: "THE DISH",
    hostLogout: "LOG OUT",
    hostNewTable: "NEW TABLE",
    hostTableId: "TABLE ID...",
    hostStartSession: "START SESSION",
    hostActiveDinners: "ACTIVE DINNERS",
    hostAct: "ACT",
    hostCompletedToday: "COMPLETED TODAY",
    hostActive: "ACTIVE",
    hostWaiting: "WAITING",
    hostPaused: "PAUSED",
    hostCompleted: "COMPLETED",
    hostEnterPin: "ENTER HOST PIN",
    hostId: "ID:",
    hostCopyLink: "COPY LINK",
    hostCurrent: "CURRENT",
    hostDish: "DISH",
    hostTimeRemaining: "TIME REMAINING",
    hostRestartTimer: "RESTART TIMER",
    hostStartExperience: "START EXPERIENCE",
    hostResume: "RESUME",
    hostPause: "PAUSE",
    hostAdvanceAct: "ADVANCE ACT",
    hostEndDinner: "END DINNER",
    hostNext: "NEXT",
    hostResetToStart: "RESET TO START",
    hostNewDinner: "NEW DINNER",
    hostTableSession: "TABLE / SESSION NAME",
    hostStartDinner: "START DINNER",
    hostNoActive: "NO ACTIVE SESSIONS",
    hostQrCode: "QR CODE",
    hostScanQr: "Scan with camera to open guest session",
    hostCopied: "COPIED",
    pwaInstall: "INSTALL APP",
    pwaInstallPrompt: "Add to Home Screen for a seamless full-screen experience without browser bars.",
    pwaIosTitle: "Install on iPhone / iPad",
    pwaIosStep1: "1. Tap the Share button in Safari toolbar.",
    pwaIosStep2: "2. Scroll down and tap 'Add to Home Screen'.",
    fullscreen: "Fullscreen"
  },
  ES: {
    welcomeTitle: "TU VELADA\nCOMIENZA AQUÍ.",
    welcomeSubtitle: "Elige la experiencia que quieres compartir.",
    enter: "ENTRAR",
    pass: "PASAR",
    nextMomentIn: "PRÓXIMO MOMENTO EN",
    nextMoment: "PRÓXIMO MOMENTO",
    waitFirstCourse: "ESPERA TU PRIMER PLATO.",
    firstCourseReady: "TU PRIMER PLATO ESTÁ LISTO.",
    welcomeBack: "BIENVENIDO DE NUEVO.\nTU VELADA CONTINÚA.",
    endTitle: "LOS SIETE MOMENTOS SON TUYOS.",
    endSubtitle: "Quédate el tiempo que quieras.",
    moments: "7 momentos.\nUna velada.\nDos personas.",
    devMode: "MODO DEV: TEMPORIZADORES A 10s",
    minutes: "minutos",
    seconds: "segundos",
    infoTitle: "ESTA NOCHE",
    infoDesc1: "Esta no es una cena que simplemente miras.",
    infoDesc2: "Es una cena que experimentan juntos.\nElige una experiencia, sigue los momentos a medida que llegan y deja que la noche se desarrolle a su propio ritmo.",
    howItWorks: "CÓMO FUNCIONA",
    howItWorks1: "Elige una de las tres experiencias.",
    howItWorks2: "Aparecerá un nuevo momento con cada plato.",
    howItWorks3: "Léanlo juntos.\nLuego dejen el teléfono.\nLa cena ocurre entre ustedes.",
    theDish: "EL PLATO",
    hostLogout: "CERRAR SESIÓN",
    hostNewTable: "NUEVA MESA",
    hostTableId: "ID DE MESA...",
    hostStartSession: "INICIAR SESIÓN",
    hostActiveDinners: "CENAS ACTIVAS",
    hostAct: "ACTO",
    hostCompletedToday: "COMPLETADAS HOY",
    hostActive: "ACTIVA",
    hostWaiting: "EN ESPERA",
    hostPaused: "PAUSADA",
    hostCompleted: "COMPLETADA",
    hostEnterPin: "INTRODUCIR PIN DE HOST",
    hostId: "ID:",
    hostCopyLink: "COPIAR ENLACE",
    hostCurrent: "ACTUAL",
    hostDish: "PLATO",
    hostTimeRemaining: "TIEMPO RESTANTE",
    hostRestartTimer: "REINICIAR TIEMPO",
    hostStartExperience: "INICIAR EXPERIENCIA",
    hostResume: "REANUDAR",
    hostPause: "PAUSA",
    hostAdvanceAct: "AVANZAR ACTO",
    hostEndDinner: "FINALIZAR CENA",
    hostNext: "SIGUIENTE",
    hostResetToStart: "REINICIAR AL PRINCIPIO",
    hostNewDinner: "NUEVA CENA",
    hostTableSession: "MESA / SESIÓN",
    hostStartDinner: "INICIAR CENA",
    hostNoActive: "SIN CENAS ACTIVAS",
    hostQrCode: "CÓDIGO QR",
    hostScanQr: "Escanea con la cámara para abrir la sesión",
    hostCopied: "COPIADO",
    pwaInstall: "INSTALAR APP",
    pwaInstallPrompt: "Añade a la pantalla de inicio para una experiencia inmersiva a pantalla completa sin interfaz del navegador.",
    pwaIosTitle: "Instalar en iPhone / iPad",
    pwaIosStep1: "1. Toca el botón Compartir en la barra de Safari.",
    pwaIosStep2: "2. Desplázate hacia abajo y pulsa 'Añadir a pantalla de inicio'.",
    fullscreen: "Pantalla completa"
  },
  RU: {
    welcomeTitle: "ВАШ ВЕЧЕР\nНАЧИНАЕТСЯ ЗДЕСЬ.",
    welcomeSubtitle: "Выберите опыт, который хотите разделить.",
    enter: "ВОЙТИ",
    pass: "ПРОПУСТИТЬ",
    nextMomentIn: "СЛЕДУЮЩИЙ МОМЕНТ ЧЕРЕЗ",
    nextMoment: "СЛЕДУЮЩИЙ МОМЕНТ",
    waitFirstCourse: "ОЖИДАЙТЕ ПЕРВОЕ БЛЮДО.",
    firstCourseReady: "ВАШЕ ПЕРВОЕ БЛЮДО ГОТОВО.",
    welcomeBack: "С ВОЗВРАЩЕНИЕМ.\nВАШ ВЕЧЕР ПРОДОЛЖАЕТСЯ.",
    endTitle: "ЭТИ СЕМЬ МОМЕНТОВ - ВАШИ.",
    endSubtitle: "Оставайтесь так долго, как захотите.",
    moments: "7 моментов.\nОдин вечер.\nДва человека.",
    devMode: "DEV РЕЖИМ: ТАЙМЕРЫ НА 10с",
    minutes: "минуты",
    seconds: "секунды",
    infoTitle: "СЕГОДНЯ ВЕЧЕРОМ",
    infoDesc1: "Это не тот ужин, который вы просто наблюдаете.",
    infoDesc2: "Это ужин, который вы проживаете вместе.\nВыберите опыт, следуйте за моментами по мере их появления, и позвольте вечеру раскрываться в своем собственном темпе.",
    howItWorks: "КАК ЭТО РАБОТАЕТ",
    howItWorks1: "Выберите один из трех сценариев.",
    howItWorks2: "С каждым блюдом будет появляться новый момент.",
    howItWorks3: "Прочитайте его вместе.\nЗатем отложите телефон.\nУжин происходит между вами.",
    theDish: "БЛЮДО",
    hostLogout: "ВЫЙТИ",
    hostNewTable: "НОВЫЙ СТОЛ",
    hostTableId: "ID СТОЛА...",
    hostStartSession: "НАЧАТЬ СЕССИЮ",
    hostActiveDinners: "АКТИВНЫЕ УЖИНЫ",
    hostAct: "АКТ",
    hostCompletedToday: "ЗАВЕРШЕННЫЕ СЕГОДНЯ",
    hostActive: "АКТИВЕН",
    hostWaiting: "ОЖИДАНИЕ",
    hostPaused: "ПАУЗА",
    hostCompleted: "ЗАВЕРШЕН",
    hostEnterPin: "ВВЕДИТЕ PIN ХОСТА",
    hostId: "ID:",
    hostCopyLink: "КОПИРОВАТЬ",
    hostCurrent: "ТЕКУЩИЙ",
    hostDish: "БЛЮДО",
    hostTimeRemaining: "ОСТАВШЕЕСЯ ВРЕМЯ",
    hostRestartTimer: "СБРОСИТЬ ТАЙМЕР",
    hostStartExperience: "НАЧАТЬ ОПЫТ",
    hostResume: "ПРОДОЛЖИТЬ",
    hostPause: "ПАУЗА",
    hostAdvanceAct: "СЛЕДУЮЩИЙ АКТ",
    hostEndDinner: "ЗАВЕРШИТЬ УЖИН",
    hostNext: "СЛЕДУЮЩИЙ",
    hostResetToStart: "НАЧАТЬ СНАЧАЛА",
    hostNewDinner: "НОВЫЙ УЖИН",
    hostTableSession: "ИМЯ СТОЛА / СЕССИИ",
    hostStartDinner: "НАЧАТЬ УЖИН",
    hostNoActive: "НЕТ АКТИВНЫХ УЖИНОВ",
    hostQrCode: "QR-КОД",
    hostScanQr: "Отсканируйте камерой телефона, чтобы открыть сессию",
    hostCopied: "СКОПИРОВАНО",
    pwaInstall: "УСТАНОВИТЬ",
    pwaInstallPrompt: "Добавьте на главный экран для полноэкранного режима без интерфейса браузера.",
    pwaIosTitle: "Установка на iPhone / iPad",
    pwaIosStep1: "1. Нажмите кнопку «Поделиться» внизу в панели Safari.",
    pwaIosStep2: "2. Прокрутите и выберите «На экран Домой».",
    fullscreen: "На весь экран"
  }
};

export const scenariosData: Record<Language, Scenario[]> = {
  EN: [
    {
      id: 'first-date',
      title: 'FIRST DATE',
      subtitle: 'An immersive dinner for two.',
      description: 'A dinner for two about attraction, discovery, trust and imagination.',
      introText: '7 moments.\nOne evening.\nTwo people.',
      acts: [
        {
          id: 'fd-1',
          number: '01',
          theme: 'ATTRACTION',
          title: 'THE GLANCE',
          instruction: "Look at the person sitting opposite you.\n\nDon’t rush to speak.\n\nLet your eyes rest on one detail.\n\nWhat exactly attracted your attention?\n\nSay it.\n\nNow discover what they noticed in you.",
          dishName: 'THE GLANCE\nMini Tuna Tostada',
          dishDescription: 'Fresh tuna, avocado, cucumber, lime and serrano on a crisp corn tostada.'
        },
        {
          id: 'fd-2',
          number: '02',
          theme: 'COMMONALITY',
          title: 'THE COMMON GROUND',
          instruction: "Now find something that already belongs to both of you.\n\nMusic.\nFood.\nA film.\nA place.\nA strange habit.\n\nSomething unexpected.\n\nFound it?\n\nNow each of you name one thing that genuinely makes you happy.",
          dishName: 'THE COMMON GROUND\nGrilled Sourdough · Whipped Chile Butter · Charred Corn',
          dishDescription: 'Warm sourdough, whipped chile ancho butter, charred corn, pickled red onion and epazote.'
        },
        {
          id: 'fd-3',
          number: '03',
          theme: 'TRUST',
          title: 'TRUST',
          instruction: "Close your eyes.\n\nDon’t ask what you’ve been given.\n\nLet the person opposite you feed you.\n\nDon’t control it.\n\nJust feel.\n\nWhat appeared first —\n\nthe taste or the trust?",
          dishName: 'TRUST\nOyster · Cucumber Aguachile · Cilantro Oil',
          dishDescription: 'One oyster per person, served cold with cucumber aguachile, lime and cilantro oil.'
        },
        {
          id: 'fd-4',
          number: '04',
          theme: 'MEMORY',
          title: 'MEMORY',
          instruction: "Some tastes remember us longer than people do.\n\nTry it.\n\nWhere did it take you?\n\nRemember one moment from childhood.\n\nNot the most important one.\n\nThe most alive one.\n\nTell it to the person opposite you.\n\nNow breathe in the aroma.\n\nWhat else did it remind you of?",
          dishName: 'MEMORY\nMole Negro Taco',
          dishDescription: 'Chicken · Mole Negro · Queso Fresco · Sesame · Cacao'
        },
        {
          id: 'fd-5',
          number: '05',
          theme: 'IMAGINATION',
          title: 'IMAGINATION',
          instruction: "Close your eyes.\n\nImagine:\n\nOne month has passed.\n\nYou are together again.\n\nWhat happened?\n\nWhere did you go?\n\nWhat did you discover about each other?\n\nDon’t predict.\n\nInvent it.",
          dishName: 'IMAGINATION\nMango · Lime · Chile Piquín · Mezcal · Mint',
          dishDescription: 'A bright, fresh palate cleanser to spark the imagination.'
        },
        {
          id: 'fd-6',
          number: '06',
          theme: 'INTIMACY',
          title: 'INTIMACY',
          instruction: "It's time to be a little more honest.\n\nTell each other one thing that is truly important to you.\n\nNot what sounds beautiful.\n\nWhat is real.\n\nThen ask:\n\n“What do you want to feel tonight?”\n\nDon't answer immediately.\n\nLook at each other first.",
          dishName: 'SHORT RIB TACO',
          dishDescription: 'Short rib / pork cheek alternative · tortilla · pasilla · avocado · crema · onion · cilantro.'
        },
        {
          id: 'fd-7',
          number: '07',
          theme: 'CONTINUATION',
          title: 'CONTINUATION',
          instruction: "The dinner is ending.\n\nBut your evening is not.\n\nLook at each other.\n\nImagine this door opens right now.\n\nWhere will you go?\n\nWhat will you do?\n\nDon't delay the continuation.\n\nSometimes one good night deserves another.",
          dishName: 'MEZCAL CHOCOLATE',
          dishDescription: 'Dark chocolate · mezcal caramel · cacao nib · orange · salt.'
        }
      ]
    },
    {
      id: 'best-friends',
      title: 'BEST FRIENDS',
      subtitle: 'An immersive dinner for two.',
      description: 'A dinner for two about friendship, shared memories, playfulness and being present together.',
      introText: '7 moments.\nOne evening.\nTwo people.',
      acts: [
        {
          id: 'bf-1',
          number: '01',
          theme: 'APPRECIATION',
          title: 'YOU',
          instruction: "Look at the person opposite you.\n\nOf all the people you could have met today,\nyou ended up here together.\n\nWhy?\n\nName one thing you are grateful for in this friendship.\n\nNot a beautiful answer.\n\nA real one.",
          dishName: 'THE HELLO\nMini Shrimp Tostada',
          dishDescription: 'Shrimp · avocado · lime · serrano · cilantro · pickled onion.'
        },
        {
          id: 'bf-2',
          number: '02',
          theme: 'SHARED MEMORY',
          title: 'THAT MOMENT',
          instruction: "Every friendship has a story that cannot really be told to outsiders.\n\nRemember yours.\n\nThat night.\nThat trip.\nThat mistake.\nThat laugh.\n\nTell it as if it were happening again.\n\nAnd check:\n\ndo you remember it the same way?",
          dishName: 'THE MEMORY\nCarnitas Taco',
          dishDescription: 'Carnitas · salsa verde · queso fresco · onion · cilantro · lime.'
        },
        {
          id: 'bf-3',
          number: '03',
          theme: 'PLAYFULNESS / SENSES',
          title: 'THE SECRET',
          instruction: "Close your eyes.\n\nTaste.\n\nDon’t guess.\n\nFeel.\n\nWhich flavour arrived first?\n\nNow give it a name.\n\nIt doesn’t have to be correct.\n\nThe stranger, the better.",
          dishName: 'THE SECRET\nMushroom · Corn · Mole Taco',
          dishDescription: 'Blue corn tortilla · roasted oyster mushroom · sweet corn · mole · sesame · hoja santa.'
        },
        {
          id: 'bf-4',
          number: '04',
          theme: 'ASSOCIATION',
          title: 'THE ORANGE',
          instruction: "Breathe in.\n\nDon’t think.\n\nThe first place.\nThe first person.\nThe first song.\n\nWhat appeared?\n\nSay the first thing that came to mind.\n\nThen compare.",
          dishName: 'THE ORANGE\nBlood Orange · Burrata',
          dishDescription: 'Blood Orange · Burrata · Chile Oil · Basil.'
        },
        {
          id: 'bf-5',
          number: '05',
          theme: 'FUTURE',
          title: 'THE ESCAPE',
          instruction: "Imagine yourselves five years from now.\n\nWhat has changed?\n\nWhere are you?\n\nWhat are you still doing together?\n\nNow invent one thing you are obliged to do.\n\nA trip.\nAn adventure.\nA foolishness.\nA dream.\n\nAssign a date.",
          dishName: 'THE ESCAPE\nTuna · Mango Tostada',
          dishDescription: 'Mini tostada, tuna, mango, jalapeño, lime, sesame, cilantro.'
        },
        {
          id: 'bf-6',
          number: '06',
          theme: 'PRESENCE',
          title: 'THE TABLE',
          instruction: "Put your phones face down.\n\nLook at each other.\n\nRemember nothing.\n\nPlan nothing.\n\nJust be here.\n\nSometimes friendship is the luxury of having someone you can be silent with.",
          dishName: 'THE TABLE\nQueso Fundido',
          dishDescription: 'Queso Fundido · Mushroom · Poblano · Epazote. One shared plate for two.'
        },
        {
          id: 'bf-7',
          number: '07',
          theme: 'CELEBRATION',
          title: 'THE LAST DANCE',
          instruction: "The dinner is about to finish,\nbut the weekend has just begun.\n\nSpend it together brightly, having fun.\n\nRemember that the highest ecstasy is attention at its fullest.\n\nRaise your glasses.\n\nTo the next story.",
          dishName: 'THE LAST DANCE\nMini Churros · Mezcal Chocolate',
          dishDescription: 'Warm churros to share, with dark chocolate and mezcal caramel.'
        }
      ]
    },
    {
      id: 'relationship-reboost',
      title: 'RELATIONSHIP REBOOST',
      subtitle: 'An immersive dinner for two.',
      description: 'A dinner for two about desire, reconnection, shared history, romance and gratitude.',
      introText: '7 moments.\nOne evening.\nTwo people.',
      acts: [
        {
          id: 'rr-1',
          number: '01',
          theme: 'DESIRE',
          title: 'THE LOOK',
          instruction: "Look at your partner.\n\nNot at the person you’ve known for years.\n\nAt the person you once wanted to know.\n\nHold their gaze.\n\nWhat still attracts you?\n\nDon’t explain.\n\nJust show it with your eyes.",
          dishName: 'THE LOOK\nTuna / Avocado / Jalapeño / Lime',
          dishDescription: 'Very clean presentation. Minimal garnish.'
        },
        {
          id: 'rr-2',
          number: '02',
          theme: 'APPRECIATION',
          title: 'THE FAVORITE',
          instruction: "Remember one small thing your partner does for you.\n\nNot a celebration.\n\nNot a grand gesture.\n\nSomething almost invisible.\n\nName it.\n\nNow say:\n\n“I notice it.”\n\nAnd add:\n\n“Thank you.”",
          dishName: 'THE FAVORITE\nWarm Brioche',
          dishDescription: 'Warm Brioche · Chicken Liver Mousse · Fig · Chile.'
        },
        {
          id: 'rr-3',
          number: '03',
          theme: 'RECONNECTION',
          title: 'THE BEGINNING',
          instruction: "Take each other’s hands.\n\nClose your eyes.\n\nRemember the first touch.\n\nThe first look.\n\nThe first date.\n\nThat moment when you still didn’t know where all of this would lead.\n\nNow open your eyes.\n\nLook at each other for three minutes.\n\nWithout words.",
          dishName: 'THE BEGINNING\nQuesillo',
          dishDescription: 'Quesillo · Epazote · Salsa Verde. One shared plate.'
        },
        {
          id: 'rr-4',
          number: '04',
          theme: 'SHARED HISTORY',
          title: 'THE YEARS',
          instruction: "Your story doesn't just consist of major events.\n\nIt lives in the small moments.\n\nOn the road, in the kitchen, in a random Sunday.\n\nRemember one moment that no one else could understand the way you do.\n\nTell it.\n\nLook at how much you've already lived through.",
          dishName: 'THE YEARS\nShort Rib Taco',
          dishDescription: 'Short rib · tortilla · pasilla · avocado · crema · onion · cilantro.'
        },
        {
          id: 'rr-5',
          number: '05',
          theme: 'ROMANCE',
          title: 'THE MORNING',
          instruction: "Close your eyes.\n\nTaste the dish.\n\nYour partner can help you with it.\n\nRemember the first time you had breakfast in bed.\n\nIt was romantic.\n\nAnd no one can stop you from repeating it whenever you want.",
          dishName: 'THE MORNING\nWarm Brioche + Chocolate',
          dishDescription: 'Warm Brioche · Mexican Chocolate · Banana · Cinnamon'
        },
        {
          id: 'rr-6',
          number: '06',
          theme: 'SHARED ADVENTURES',
          title: 'THE JOURNEY',
          instruction: "Breathe in.\n\nWhere does this aroma transport you?\n\nThink about the travels you’ve shared.\n\nWhat memories come back with this perfume?\n\nShare the best emotions you experienced together.\n\nNow imagine the next one.",
          dishName: 'THE JOURNEY\nScallop / Mango',
          dishDescription: 'Scallop / Mango / Habanero / Lime'
        },
        {
          id: 'rr-7',
          number: '07',
          theme: 'GRATITUDE',
          title: 'THE LAST KISS',
          instruction: "Look at the person next to you.\n\nThink about what you can be thankful to your beloved for, exactly today.\n\nNot the whole history.\n\nThis day.\n\nTell them.\n\nCollect the good moments of your life.\n\nTake their hand.\n\nSome things don't need fixing. They need protecting.",
          dishName: 'THE LAST KISS\nChocolate Bonbon',
          dishDescription: 'Chocolate Bonbon · Mezcal · Salt · Orange. Two bonbons on one plate.'
        }
      ]
    }
  ],
  ES: [
    {
      id: 'first-date',
      title: 'PRIMERA CITA',
      subtitle: 'Una cena inmersiva para dos.',
      description: 'Una cena para dos sobre la atracción, el descubrimiento, la confianza y la imaginación.',
      introText: '7 momentos.\nUna velada.\nDos personas.',
      acts: [
        {
          id: 'fd-1',
          number: '01',
          theme: 'ATRACCIÓN',
          title: 'LA MIRADA',
          instruction: "Mira a la persona sentada frente a ti.\n\nNo te apresures a hablar.\n\nDeja que tus ojos descansen en un detalle.\n\n¿Qué atrajo exactamente tu atención?\n\nDilo.\n\nAhora descubre lo que notaron en ti.",
          dishName: 'LA MIRADA\nMini Tostada de Atún',
          dishDescription: 'Atún fresco, aguacate, pepino, lima y serrano sobre una tostada de maíz crujiente.'
        },
        {
          id: 'fd-2',
          number: '02',
          theme: 'PUNTOS EN COMÚN',
          title: 'TERRENO COMPARTIDO',
          instruction: "Ahora encuentra algo que ya les pertenezca a ambos.\n\nMúsica.\nComida.\nUna película.\nUn lugar.\nUn hábito extraño.\n\nAlgo inesperado.\n\n¿Lo encontraste?\n\nAhora cada uno nombre una cosa que genuinamente lo haga feliz.",
          dishName: 'TERRENO COMPARTIDO\nPan de Masa Madre · Mantequilla de Chile · Maíz Asado',
          dishDescription: 'Pan de masa madre caliente, mantequilla batida de chile ancho, maíz asado, cebolla roja encurtida y epazote.'
        },
        {
          id: 'fd-3',
          number: '03',
          theme: 'CONFIANZA',
          title: 'CONFIANZA',
          instruction: "Cierra los ojos.\n\nNo preguntes qué te han dado.\n\nDeja que la persona frente a ti te dé de comer.\n\nNo lo controles.\n\nSolo siente.\n\n¿Qué apareció primero —\n\nel sabor o la confianza?",
          dishName: 'CONFIANZA\nOstra · Aguachile de Pepino · Aceite de Cilantro',
          dishDescription: 'Una ostra por persona, servida fría con aguachile de pepino, lima y aceite de cilantro.'
        },
        {
          id: 'fd-4',
          number: '04',
          theme: 'MEMORIA',
          title: 'MEMORIA',
          instruction: "Algunos sabores nos recuerdan por más tiempo que las personas.\n\nPruébalo.\n\n¿Adónde te llevó?\n\nRecuerda un momento de la infancia.\n\nNo el más importante.\n\nEl más vivo.\n\nCuéntaselo a la persona que tienes enfrente.\n\nAhora respira el aroma.\n\n¿A qué más te recordó?",
          dishName: 'MEMORIA\nTaco de Mole Negro',
          dishDescription: 'Pollo · Mole Negro · Queso Fresco · Sésamo · Cacao'
        },
        {
          id: 'fd-5',
          number: '05',
          theme: 'IMAGINACIÓN',
          title: 'IMAGINACIÓN',
          instruction: "Cierra los ojos.\n\nImagina:\n\nHa pasado un mes.\n\nEstán juntos de nuevo.\n\n¿Qué pasó?\n\n¿A dónde fueron?\n\n¿Qué descubrieron el uno del otro?\n\nNo predigas.\n\nInvéntalo.",
          dishName: 'IMAGINACIÓN\nMango · Lima · Chile Piquín · Mezcal · Menta',
          dishDescription: 'Un limpiador de paladar fresco y brillante para encender la imaginación.'
        },
        {
          id: 'fd-6',
          number: '06',
          theme: 'INTIMIDAD',
          title: 'INTIMIDAD',
          instruction: "Es hora de ser un poco más honestos.\n\nDíganse una cosa que sea verdaderamente importante para ustedes.\n\nNo lo que suene hermoso.\n\nLo que sea real.\n\nLuego pregunten:\n\n“¿Qué quieres sentir esta noche?”\n\nNo respondan de inmediato.\n\nMírense primero.",
          dishName: 'TACO DE COSTILLA',
          dishDescription: 'Costilla / alternativa de mejilla de cerdo · tortilla · pasilla · aguacate · crema · cebolla · cilantro.'
        },
        {
          id: 'fd-7',
          number: '07',
          theme: 'CONTINUACIÓN',
          title: 'CONTINUACIÓN',
          instruction: "La cena está terminando.\n\nPero su noche no.\n\nMírense el uno al otro.\n\nImaginen que esta puerta se abre ahora mismo.\n\n¿A dónde irán?\n\n¿Qué harán?\n\nNo retrasen la continuación.\n\nA veces una buena noche merece otra.",
          dishName: 'CHOCOLATE CON MEZCAL',
          dishDescription: 'Chocolate negro · caramelo de mezcal · nibs de cacao · naranja · sal.'
        }
      ]
    },
    {
      id: 'best-friends',
      title: 'MEJORES AMIGOS',
      subtitle: 'Una cena inmersiva para dos.',
      description: 'Una cena para dos sobre la amistad, los recuerdos compartidos, la diversión y estar presentes juntos.',
      introText: '7 momentos.\nUna velada.\nDos personas.',
      acts: [
        {
          id: 'bf-1',
          number: '01',
          theme: 'APRECIACIÓN',
          title: 'TÚ',
          instruction: "Mira a la persona frente a ti.\n\nDe todas las personas que podrías haber conocido hoy,\nterminaron aquí juntos.\n\n¿Por qué?\n\nNombra una cosa por la que estés agradecido en esta amistad.\n\nNo una respuesta hermosa.\n\nUna real.",
          dishName: 'EL SALUDO\nMini Tostada de Camarón',
          dishDescription: 'Camarón · aguacate · lima · serrano · cilantro · cebolla encurtida.'
        },
        {
          id: 'bf-2',
          number: '02',
          theme: 'MEMORIA COMPARTIDA',
          title: 'ESE MOMENTO',
          instruction: "Cada amistad tiene una historia que realmente no se puede contar a extraños.\n\nRecuerden la suya.\n\nEsa noche.\nEse viaje.\nEse error.\nEsa risa.\n\nCuéntenla como si estuviera sucediendo de nuevo.\n\nY comprueben:\n\n¿lo recuerdan de la misma manera?",
          dishName: 'LA MEMORIA\nTaco de Carnitas',
          dishDescription: 'Carnitas · salsa verde · queso fresco · cebolla · cilantro · lima.'
        },
        {
          id: 'bf-3',
          number: '03',
          theme: 'DIVERSIÓN / SENTIDOS',
          title: 'EL SECRETO',
          instruction: "Cierra los ojos.\n\nPrueba.\n\nNo adivines.\n\nSiente.\n\n¿Qué sabor llegó primero?\n\nAhora ponle un nombre.\n\nNo tiene que ser correcto.\n\nCuanto más extraño, mejor.",
          dishName: 'EL SECRETO\nTaco de Champiñón · Maíz · Mole',
          dishDescription: 'Tortilla de maíz azul · champiñón ostra asado · maíz dulce · mole · sésamo · hoja santa.'
        },
        {
          id: 'bf-4',
          number: '04',
          theme: 'ASOCIACIÓN',
          title: 'LA NARANJA',
          instruction: "Respira.\n\nNo pienses.\n\nEl primer lugar.\nLa primera persona.\nLa primera canción.\n\n¿Qué apareció?\n\nDi lo primero que te vino a la mente.\n\nLuego compara.",
          dishName: 'LA NARANJA\nNaranja Sanguina · Burrata',
          dishDescription: 'Naranja Sanguina · Burrata · Aceite de Chile · Albahaca.'
        },
        {
          id: 'bf-5',
          number: '05',
          theme: 'FUTURO',
          title: 'EL ESCAPE',
          instruction: "Imagínense dentro de cinco años.\n\n¿Qué ha cambiado?\n\n¿Dónde están?\n\n¿Qué siguen haciendo juntos?\n\nAhora inventen una cosa que están obligados a hacer.\n\nUn viaje.\nUna aventura.\nUna tontería.\nUn sueño.\n\nAsignen una fecha.",
          dishName: 'EL ESCAPE\nTostada de Atún · Mango',
          dishDescription: 'Mini tostada, atún, mango, jalapeño, lima, sésamo, cilantro.'
        },
        {
          id: 'bf-6',
          number: '06',
          theme: 'PRESENCIA',
          title: 'LA MESA',
          instruction: "Pongan sus teléfonos boca abajo.\n\nMírense el uno al otro.\n\nNo recuerden nada.\n\nNo planeen nada.\n\nSolo estén aquí.\n\nA veces la amistad es el lujo de tener a alguien con quien puedes estar en silencio.",
          dishName: 'LA MESA\nQueso Fundido',
          dishDescription: 'Queso Fundido · Champiñón · Poblano · Epazote. Un plato para compartir.'
        },
        {
          id: 'bf-7',
          number: '07',
          theme: 'CELEBRACIÓN',
          title: 'EL ÚLTIMO BAILE',
          instruction: "La cena está a punto de terminar,\npero el fin de semana acaba de comenzar.\n\nPásenlo juntos brillantemente, divirtiéndose.\n\nRecuerden que el éxtasis más alto es la atención en su plenitud.\n\nLevanten sus copas.\n\nPor la próxima historia.",
          dishName: 'EL ÚLTIMO BAILE\nMini Churros · Chocolate con Mezcal',
          dishDescription: 'Churros calientes para compartir, con chocolate negro y caramelo de mezcal.'
        }
      ]
    },
    {
      id: 'relationship-reboost',
      title: 'RENOVACIÓN DE RELACIÓN',
      subtitle: 'Una cena inmersiva para dos.',
      description: 'Una cena para dos sobre el deseo, la reconexión, la historia compartida, el romance y la gratitud.',
      introText: '7 momentos.\nUna velada.\nDos personas.',
      acts: [
        {
          id: 'rr-1',
          number: '01',
          theme: 'DESEO',
          title: 'LA MIRADA',
          instruction: "Mira a tu pareja.\n\nNo a la persona que conoces desde hace años.\n\nA la persona que alguna vez quisiste conocer.\n\nMantén su mirada.\n\n¿Qué te atrae todavía?\n\nNo lo expliques.\n\nSolo muéstralo con tus ojos.",
          dishName: 'LA MIRADA\nAtún / Aguacate / Jalapeño / Lima',
          dishDescription: 'Presentación muy limpia. Guarnición mínima.'
        },
        {
          id: 'rr-2',
          number: '02',
          theme: 'APRECIACIÓN',
          title: 'EL FAVORITO',
          instruction: "Recuerda una pequeña cosa que tu pareja hace por ti.\n\nNo una celebración.\n\nNo un gran gesto.\n\nAlgo casi invisible.\n\nNómbralo.\n\nAhora di:\n\n“Lo noto.”\n\nY añade:\n\n“Gracias.”",
          dishName: 'EL FAVORITO\nBrioche Caliente',
          dishDescription: 'Brioche Caliente · Mousse de Hígado de Pollo · Higo · Chile.'
        },
        {
          id: 'rr-3',
          number: '03',
          theme: 'RECONEXIÓN',
          title: 'EL PRINCIPIO',
          instruction: "Tómense de las manos.\n\nCierren los ojos.\n\nRecuerden el primer toque.\n\nLa primera mirada.\n\nLa primera cita.\n\nEse momento en el que aún no sabían a dónde llevaría todo esto.\n\nAhora abran los ojos.\n\nMírense durante tres minutos.\n\nSin palabras.",
          dishName: 'EL PRINCIPIO\nQuesillo',
          dishDescription: 'Quesillo · Epazote · Salsa Verde. Un plato compartido.'
        },
        {
          id: 'rr-4',
          number: '04',
          theme: 'HISTORIA COMPARTIDA',
          title: 'LOS AÑOS',
          instruction: "Su historia no solo consiste en eventos importantes.\n\nVive en los pequeños momentos.\n\nEn el camino, en la cocina, en un domingo cualquiera.\n\nRecuerda un momento que nadie más podría entender como tú lo haces.\n\nCuéntalo.\n\nMira todo lo que ya han vivido.",
          dishName: 'LOS AÑOS\nTaco de Costilla',
          dishDescription: 'Costilla · tortilla · pasilla · aguacate · crema · cebolla · cilantro.'
        },
        {
          id: 'rr-5',
          number: '05',
          theme: 'ROMANCE',
          title: 'LA MAÑANA',
          instruction: "Cierra los ojos.\n\nPrueba el plato.\n\nTu pareja te puede ayudar con ello.\n\nRecuerda la primera vez que desayunaron en la cama.\n\nFue romántico.\n\nY nadie les impide repetirlo cuando quieran.",
          dishName: 'LA MAÑANA\nBrioche Caliente + Chocolate',
          dishDescription: 'Brioche Caliente · Chocolate Mexicano · Plátano · Canela'
        },
        {
          id: 'rr-6',
          number: '06',
          theme: 'AVENTURAS COMPARTIDAS',
          title: 'EL VIAJE',
          instruction: "Respira.\n\n¿A dónde te transporta este aroma?\n\nPiensa en los viajes que han compartido.\n\n¿Qué recuerdos vuelven con este perfume?\n\nComparte las mejores emociones que vivieron juntos.\n\nAhora imagina la siguiente.",
          dishName: 'EL VIAJE\nVieira / Mango',
          dishDescription: 'Vieira / Mango / Habanero / Lima'
        },
        {
          id: 'rr-7',
          number: '07',
          theme: 'GRATITUD',
          title: 'EL ÚLTIMO BESO',
          instruction: "Mira a la persona a tu lado.\n\nPiensa en lo que le puedes agradecer a tu amado/a, exactamente hoy.\n\nNo toda la historia.\n\nEste día.\n\nDíselo.\n\nRecopilen los buenos momentos de su vida.\n\nToma su mano.\n\nAlgunas cosas no necesitan arreglarse. Necesitan protegerse.",
          dishName: 'EL ÚLTIMO BESO\nBombón de Chocolate',
          dishDescription: 'Bombón de Chocolate · Mezcal · Sal · Naranja. Dos bombones en un plato.'
        }
      ]
    }
  ],
  RU: [
    {
      id: 'first-date',
      title: 'ПЕРВОЕ СВИДАНИЕ',
      subtitle: 'Иммерсивный ужин на двоих.',
      description: 'Ужин на двоих о влечении, открытиях, доверии и воображении.',
      introText: '7 моментов.\nОдин вечер.\nДва человека.',
      acts: [
        {
          id: 'fd-1',
          number: '01',
          theme: 'ВЛЕЧЕНИЕ',
          title: 'ВЗГЛЯД',
          instruction: "Посмотрите на человека, сидящего напротив вас.\n\nНе спешите говорить.\n\nОстановите взгляд на одной детали.\n\nЧто именно привлекло ваше внимание?\n\nСкажите это.\n\nТеперь узнайте, что заметили в вас.",
          dishName: 'ВЗГЛЯД\nМини Тостада с тунцом',
          dishDescription: 'Свежий тунец, авокадо, огурец, лайм и серрано на хрустящей кукурузной лепешке.'
        },
        {
          id: 'fd-2',
          number: '02',
          theme: 'ОБЩНОСТЬ',
          title: 'ОБЩИЙ ФОН',
          instruction: "Теперь найдите что-то, что уже принадлежит вам обоим.\n\nМузыка.\nЕда.\nФильм.\nМесто.\nСтранная привычка.\n\nЧто-то неожиданное.\n\nНашли?\n\nТеперь каждый назовите одну вещь, которая искренне делает вас счастливым.",
          dishName: 'ОБЩИЙ ФОН\nХлеб на закваске · Масло с чили · Жареная кукуруза',
          dishDescription: 'Теплый хлеб на закваске, взбитое масло с анчо-чили, жареная кукуруза, маринованный красный лук и эпазот.'
        },
        {
          id: 'fd-3',
          number: '03',
          theme: 'ДОВЕРИЕ',
          title: 'ДОВЕРИЕ',
          instruction: "Закройте глаза.\n\nНе спрашивайте, что вам дали.\n\nПозвольте человеку напротив накормить вас.\n\nНе контролируйте это.\n\nПросто чувствуйте.\n\nЧто появилось первым —\n\nвкус или доверие?",
          dishName: 'ДОВЕРИЕ\nУстрица · Агуачиле из огурца · Масло кинзы',
          dishDescription: 'Одна устрица на человека, подается холодной с огуречным агуачиле, лаймом и маслом кинзы.'
        },
        {
          id: 'fd-4',
          number: '04',
          theme: 'ПАМЯТЬ',
          title: 'ПАМЯТЬ',
          instruction: "Некоторые вкусы помнят нас дольше, чем люди.\n\nПопробуйте.\n\nКуда он вас перенес?\n\nВспомните один момент из детства.\n\nНе самый важный.\n\nСамый живой.\n\nРасскажите его человеку напротив.\n\nТеперь вдохните аромат.\n\nО чем еще он вам напомнил?",
          dishName: 'ПАМЯТЬ\nТако с Моле Негро',
          dishDescription: 'Курица · Моле Негро · Свежий сыр · Кунжут · Какао'
        },
        {
          id: 'fd-5',
          number: '05',
          theme: 'ВООБРАЖЕНИЕ',
          title: 'ВООБРАЖЕНИЕ',
          instruction: "Закройте глаза.\n\nПредставьте:\n\nПрошел месяц.\n\nВы снова вместе.\n\nЧто произошло?\n\nКуда вы отправились?\n\nЧто вы узнали друг о друге?\n\nНе предсказывайте.\n\nПридумайте.",
          dishName: 'ВООБРАЖЕНИЕ\nМанго · Лайм · Чили Пикин · Мескаль · Мята',
          dishDescription: 'Яркое, свежее средство для очищения нёба, пробуждающее воображение.'
        },
        {
          id: 'fd-6',
          number: '06',
          theme: 'БЛИЗОСТЬ',
          title: 'БЛИЗОСТЬ',
          instruction: "Пришло время быть немного честнее.\n\nСкажите друг другу одну вещь, которая для вас действительно важна.\n\nНе то, что звучит красиво.\n\nА то, что реально.\n\nЗатем спросите:\n\n«Что ты хочешь почувствовать сегодня вечером?»\n\nНе отвечайте сразу.\n\nСначала посмотрите друг на друга.",
          dishName: 'ТАКО С ГОВЯЖЬИМИ РЕБРЫШКАМИ',
          dishDescription: 'Говяжьи ребрышки / свиная щековина · тортилья · пасилья · авокадо · крема · лук · кинза.'
        },
        {
          id: 'fd-7',
          number: '07',
          theme: 'ПРОДОЛЖЕНИЕ',
          title: 'ПРОДОЛЖЕНИЕ',
          instruction: "Ужин заканчивается.\n\nНо ваш вечер — нет.\n\nПосмотрите друг на друга.\n\nПредставьте, что эта дверь открывается прямо сейчас.\n\nКуда вы пойдете?\n\nЧто вы будете делать?\n\nНе откладывайте продолжение.\n\nИногда одна хорошая ночь заслуживает другой.",
          dishName: 'ШОКОЛАД С МЕСКАЛЕМ',
          dishDescription: 'Темный шоколад · карамель из мескаля · какао-крупка · апельсин · соль.'
        }
      ]
    },
    {
      id: 'best-friends',
      title: 'ЛУЧШИЕ ДРУЗЬЯ',
      subtitle: 'Иммерсивный ужин на двоих.',
      description: 'Ужин на двоих о дружбе, общих воспоминаниях, игривости и присутствии здесь и сейчас.',
      introText: '7 моментов.\nОдин вечер.\nДва человека.',
      acts: [
        {
          id: 'bf-1',
          number: '01',
          theme: 'ПРИЗНАТЕЛЬНОСТЬ',
          title: 'ТЫ',
          instruction: "Посмотрите на человека напротив.\n\nИз всех людей, которых вы могли встретить сегодня,\nвы оказались здесь вместе.\n\nПочему?\n\nНазовите одну вещь, за которую вы благодарны в этой дружбе.\n\nНе красивый ответ.\n\nА настоящий.",
          dishName: 'ПРИВЕТСТВИЕ\nМини Тостада с креветками',
          dishDescription: 'Креветки · авокадо · лайм · серрано · кинза · маринованный лук.'
        },
        {
          id: 'bf-2',
          number: '02',
          theme: 'ОБЩИЕ ВОСПОМИНАНИЯ',
          title: 'ТОТ МОМЕНТ',
          instruction: "У каждой дружбы есть история, которую нельзя рассказать посторонним.\n\nВспомните вашу.\n\nТот вечер.\nТу поездку.\nТу ошибку.\nТот смех.\n\nРасскажите её так, как будто это происходит снова.\n\nИ проверьте:\n\nвы помните это одинаково?",
          dishName: 'ПАМЯТЬ\nТако Карнитас',
          dishDescription: 'Карнитас · зеленая сальса · свежий сыр · лук · кинза · лайм.'
        },
        {
          id: 'bf-3',
          number: '03',
          theme: 'ИГРИВОСТЬ / ЧУВСТВА',
          title: 'СЕКРЕТ',
          instruction: "Закройте глаза.\n\nПопробуйте.\n\nНе угадывайте.\n\nЧувствуйте.\n\nКакой вкус пришел первым?\n\nТеперь дайте ему имя.\n\nОно не обязательно должно быть правильным.\n\nЧем страннее, тем лучше.",
          dishName: 'СЕКРЕТ\nТако с грибами · Кукуруза · Моле',
          dishDescription: 'Лепешка из синей кукурузы · жареные вешенки · сладкая кукуруза · моле · кунжут · оха санта.'
        },
        {
          id: 'bf-4',
          number: '04',
          theme: 'АССОЦИАЦИЯ',
          title: 'АПЕЛЬСИН',
          instruction: "Вдохните.\n\nНе думайте.\n\nПервое место.\nПервый человек.\nПервая песня.\n\nЧто появилось?\n\nСкажите первое, что пришло на ум.\n\nПотом сравните.",
          dishName: 'АПЕЛЬСИН\nКровавый апельсин · Буррата',
          dishDescription: 'Кровавый апельсин · Буррата · Масло с чили · Базилик.'
        },
        {
          id: 'bf-5',
          number: '05',
          theme: 'БУДУЩЕЕ',
          title: 'ПОБЕГ',
          instruction: "Представьте себя через пять лет.\n\nЧто изменилось?\n\nГде вы?\n\nЧто вы всё еще делаете вместе?\n\nТеперь придумайте одну вещь, которую вы обязаны сделать.\n\nПоездка.\nПриключение.\nГлупость.\nМечта.\n\nНазначьте дату.",
          dishName: 'ПОБЕГ\nТостада с тунцом · Манго',
          dishDescription: 'Мини тостада, тунец, манго, халапеньо, лайм, кунжут, кинза.'
        },
        {
          id: 'bf-6',
          number: '06',
          theme: 'ПРИСУТСТВИЕ',
          title: 'СТОЛ',
          instruction: "Положите телефоны экраном вниз.\n\nПосмотрите друг на друга.\n\nНичего не вспоминайте.\n\nНичего не планируйте.\n\nПросто будьте здесь.\n\nИногда дружба — это роскошь иметь кого-то, с кем можно помолчать.",
          dishName: 'СТОЛ\nКесо Фундидо',
          dishDescription: 'Кесо Фундидо · Грибы · Поблано · Эпазот. Одно общее блюдо на двоих.'
        },
        {
          id: 'bf-7',
          number: '07',
          theme: 'ПРАЗДНОВАНИЕ',
          title: 'ПОСЛЕДНИЙ ТАНЕЦ',
          instruction: "Ужин подходит к концу,\nно выходные только начались.\n\nПроведите их вместе ярко и весело.\n\nПомните, что высший экстаз — это полное внимание.\n\nПоднимите бокалы.\n\nЗа следующую историю.",
          dishName: 'ПОСЛЕДНИЙ ТАНЕЦ\nМини Чуррос · Шоколад с Мескалем',
          dishDescription: 'Теплые чуррос на двоих, с темным шоколадом и карамелью из мескаля.'
        }
      ]
    },
    {
      id: 'relationship-reboost',
      title: 'ОБНОВЛЕНИЕ ЧУВСТВ',
      subtitle: 'Иммерсивный ужин на двоих.',
      description: 'Ужин на двоих о желании, воссоединении, общей истории, романтике и благодарности.',
      introText: '7 моментов.\nОдин вечер.\nДва человека.',
      acts: [
        {
          id: 'rr-1',
          number: '01',
          theme: 'ЖЕЛАНИЕ',
          title: 'ВЗГЛЯД',
          instruction: "Посмотрите на своего партнера.\n\nНе на человека, которого вы знаете много лет.\n\nНа того, кого вы когда-то захотели узнать.\n\nУдержите взгляд.\n\nЧто вас всё еще привлекает?\n\nНе объясняйте.\n\nПросто покажите это глазами.",
          dishName: 'ВЗГЛЯД\nТунец / Авокадо / Халапеньо / Лайм',
          dishDescription: 'Очень чистая подача. Минимум гарнира.'
        },
        {
          id: 'rr-2',
          number: '02',
          theme: 'ПРИЗНАТЕЛЬНОСТЬ',
          title: 'ЛЮБИМОЕ',
          instruction: "Вспомните одну мелочь, которую партнер делает для вас.\n\nНе праздник.\n\nНе широкий жест.\n\nЧто-то почти незаметное.\n\nНазовите это.\n\nТеперь скажите:\n\n«Я замечаю это.»\n\nИ добавьте:\n\n«Спасибо.»",
          dishName: 'ЛЮБИМОЕ\nТеплая бриошь',
          dishDescription: 'Теплая бриошь · Мусс из куриной печени · Инжир · Чили.'
        },
        {
          id: 'rr-3',
          number: '03',
          theme: 'ВОССОЕДИНЕНИЕ',
          title: 'НАЧАЛО',
          instruction: "Возьмите друг друга за руки.\n\nЗакройте глаза.\n\nВспомните первое прикосновение.\n\nПервый взгляд.\n\nПервое свидание.\n\nТот момент, когда вы еще не знали, к чему всё это приведет.\n\nТеперь откройте глаза.\n\nСмотрите друг на друга три минуты.\n\nБез слов.",
          dishName: 'НАЧАЛО\nКесильо',
          dishDescription: 'Кесильо · Эпазот · Зеленая сальса. Одно общее блюдо.'
        },
        {
          id: 'rr-4',
          number: '04',
          theme: 'ОБЩАЯ ИСТОРИЯ',
          title: 'ГОДЫ',
          instruction: "Ваша история состоит не только из крупных событий.\n\nОна живет в мелочах.\n\nВ дороге, на кухне, в случайное воскресенье.\n\nВспомните один момент, который никто другой не смог бы понять так, как вы.\n\nРасскажите его.\n\nПосмотрите, сколько вы уже прожили вместе.",
          dishName: 'ГОДЫ\nТако с ребрышками',
          dishDescription: 'Ребрышки · тортилья · пасилья · авокадо · крема · лук · кинза.'
        },
        {
          id: 'rr-5',
          number: '05',
          theme: 'РОМАНТИКА',
          title: 'УТРО',
          instruction: "Закройте глаза.\n\nПопробуйте блюдо.\n\nВаш партнер может помочь вам в этом.\n\nВспомните, как вы впервые завтракали в постели.\n\nЭто было романтично.\n\nИ никто не мешает вам повторять это когда угодно.",
          dishName: 'УТРО\nТеплая бриошь + Шоколад',
          dishDescription: 'Теплая бриошь · Мексиканский шоколад · Банан · Корица'
        },
        {
          id: 'rr-6',
          number: '06',
          theme: 'ОБЩИЕ ПРИКЛЮЧЕНИЯ',
          title: 'ПУТЕШЕСТВИЕ',
          instruction: "Вдохните.\n\nКуда переносит вас этот аромат?\n\nПодумайте о путешествиях, которые вы разделили.\n\nКакие воспоминания возвращаются с этим запахом?\n\nПоделитесь лучшими эмоциями, которые вы пережили вместе.\n\nТеперь представьте следующее путешествие.",
          dishName: 'ПУТЕШЕСТВИЕ\nМорской гребешок / Манго',
          dishDescription: 'Морской гребешок / Манго / Хабанеро / Лайм'
        },
        {
          id: 'rr-7',
          number: '07',
          theme: 'БЛАГОДАРНОСТЬ',
          title: 'ПОСЛЕДНИЙ ПОЦЕЛУЙ',
          instruction: "Посмотрите на человека рядом с вами.\n\nПодумайте, за что вы можете быть благодарны своему любимому человеку именно сегодня.\n\nНе за всю историю.\n\nЗа этот день.\n\nСкажите ему.\n\nСобирайте хорошие моменты своей жизни.\n\nВозьмите его за руку.\n\nНекоторые вещи не нужно чинить. Их нужно оберегать.",
          dishName: 'ПОСЛЕДНИЙ ПОЦЕЛУЙ\nШоколадная конфета',
          dishDescription: 'Шоколадная конфета · Мескаль · Соль · Апельсин. Две конфеты на одной тарелке.'
        }
      ]
    }
  ]
};


