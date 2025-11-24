export interface PsychoWikiEntry {
  id: string;
  label: string;
  shortDescription: string;
  biologicalWhy: string;
  whatItFeelsLike: string;
  gentleReframes: string[];
  triggers: string[];
}

export const PSYCHO_WIKI: PsychoWikiEntry[] = [
  {
    id: 'emotional_lability',
    label: 'Emotional Lability',
    shortDescription:
      "When your mood feels like it’s swinging up and down more than usual, often very quickly.",
    biologicalWhy:
      "Emotional lability can be linked to how your nervous system and brain circuits regulate emotion. When stress, hormones, past trauma, sleep problems, or neurodivergence (like ADHD, bipolar spectrum, or borderline traits) are in the mix, the “volume knob” on feelings can become extra sensitive. Small triggers can cause big emotional spikes because your amygdala (the brain’s alarm center) fires fast, while the prefrontal cortex (the calming, logical part) is slower to respond.",
    whatItFeelsLike:
      "You might feel calm one moment, irritated or tearful the next, then suddenly fine again, often without fully understanding why. People around you may say you are ‘too sensitive’ or ‘doing too much’, which can add shame or confusion on top of what you already feel.",
    gentleReframes: [
      "Your emotional swings are not proof that you are weak or ‘possessed’; they are signs that your nervous system is working very hard.",
      "Stability is a skill and a process, not a personality you were born without.",
      "You are allowed to take your feelings seriously even if they change quickly.",
    ],
    triggers: [
      'oscillating moods',
      'mood swings',
      'up and down mood',
      'emotionally all over the place',
      'rapid mood changes',
      'my mood is just up and down',
      'my mood dey swing',
      'i dey switch anyhow',
      'one minute i am fine the next i am crying',
    ],
  },
  {
    id: 'rumination',
    label: 'Rumination',
    shortDescription:
      "When your mind keeps replaying the same worries or memories over and over, like a stuck radio station.",
    biologicalWhy:
      "Rumination is tied to the brain’s default mode network, which is active when the mind is ‘resting’ and wandering. Under stress, this network can over-focus on threats, regrets, or ‘what ifs’. High cortisol, past trauma, or perfectionism can keep the brain scanning for danger even when you’re safe, making it hard to switch off repetitive thoughts.",
    whatItFeelsLike:
      "You may lie down to rest but your brain starts replaying old conversations, embarrassing moments, or future disasters. Even when you tell yourself to stop, the thoughts circle back, leaving you drained and mentally exhausted.",
    gentleReframes: [
      "Your brain is trying to protect you by scanning for danger, even if it feels unhelpful right now.",
      "You don’t have to ‘solve’ every thought your mind throws at you.",
      "Practising stepping back from thoughts (noticing them instead of wrestling them) is a strength, not avoidance.",
    ],
    triggers: [
      'overthinking',
      'ruminating',
      'can’t stop thinking',
      'my mind won’t stop',
      'thinking too much',
      'i think too much',
      'i dey overthink',
      'my head just dey full',
      'my mind no dey rest',
    ],
  },
  {
    id: 'catastrophizing',
    label: 'Catastrophizing',
    shortDescription:
      "When your mind jumps quickly to the worst-case scenario, even from small triggers.",
    biologicalWhy:
      "Catastrophizing is a survival strategy gone overboard. The brain’s threat system (amygdala and stress hormones) is wired to spot danger early. In high-stress environments or after repeated disappointments, the brain learns that ‘expecting the worst’ feels safer than being caught off guard, so it keeps imagining disaster to protect you.",
    whatItFeelsLike:
      "A small mistake or delay can make your body feel like something terrible is definitely coming. Your heart might race, your chest might feel tight, and it becomes hard to believe any ‘calm’ explanation, even when you know it logically.",
    gentleReframes: [
      "Your brain is not being dramatic for fun; it is trying (too hard) to keep you safe.",
      "You are allowed to ask, ‘What else could be true apart from the worst-case?’",
      "Learning to hold both caution and hope at the same time is emotional maturity, not naivety.",
    ],
    triggers: [
      'worst case scenario',
      'always expecting the worst',
      'catastrophizing',
      'i know something bad will happen',
      'i just know it will end in tears',
      'e go still spoil',
      'everything will still scatter',
    ],
  },
  {
    id: 'hypervigilance',
    label: 'Hypervigilance',
    shortDescription:
      "When your body and mind feel constantly on guard, as if something bad is about to happen, even in calm situations.",
    biologicalWhy:
      "Hypervigilance is the nervous system staying stuck in ‘threat mode’. After long-term stress, unsafe environments, or trauma, the brain learns that danger can appear suddenly, so it keeps the alarm system partially on. The amygdala becomes quick to react, and stress hormones stay higher, making sounds, messages, or people’s moods feel like possible threats.",
    whatItFeelsLike:
      "You might feel jumpy, easily startled, or unable to relax. Crowds, loud noises, or even phone notifications can feel overwhelming. It can feel like you always need to be ready for bad news or drama, even when nothing is happening.",
    gentleReframes: [
      "Your body is not ‘overreacting’ for fun; it has learned from experience to protect you.",
      "Learning to stand down from constant alertness is a form of healing, not laziness.",
      "You are allowed to seek spaces and routines that help your body feel safer, not just ‘stronger’.",
    ],
    triggers: [
      'always on edge',
      'i cannot relax',
      'i can’t relax',
      'i am always alert',
      'i dey always dey on guard',
      'every small sound dey shock me',
      'i am always expecting bad news',
    ],
  },
  {
    id: 'burnout',
    label: 'Burnout',
    shortDescription:
      "When long-term stress and pressure leave you emotionally drained, unmotivated, and disconnected from things you used to care about.",
    biologicalWhy:
      "Burnout happens when the stress system has been running for too long without enough rest, support, or reward. Chronically high cortisol and adrenaline can wear down motivation circuits in the brain. Sleep, mood, and focus centers become dysregulated, making even small tasks feel heavy and joyless.",
    whatItFeelsLike:
      "You may feel tired all the time, even after sleep. Work, school, or family duties start to feel like a burden instead of meaningful. You might feel numb, irritable, or guilty for ‘not doing enough’, even though you are already overworking.",
    gentleReframes: [
      "Feeling burnt out is not proof that you are lazy; it’s proof that you have been carrying too much, for too long.",
      "Rest is not a reward you ‘earn’ after suffering; it is fuel your brain and body genuinely need.",
      "You are allowed to adjust expectations and ask for support without seeing yourself as a failure.",
    ],
    triggers: [
      'i am tired all the time',
      'i dont have strength again',
      'i don tire',
      'i am exhausted',
      'nothing excites me anymore',
      'i am just on autopilot',
      'i am tired of everything',
      'burnt out',
      'burnout',
    ],
  },
  {
    id: 'attachment_anxiety',
    label: 'Attachment Anxiety',
    shortDescription:
      "When you feel very sensitive to closeness and distance in relationships, worrying a lot about being abandoned or not loved enough.",
    biologicalWhy:
      "Attachment anxiety can develop when early relationships felt inconsistent, unpredictable, or unsafe. The brain learns to monitor signs of rejection very closely to avoid being hurt again. Oxytocin and stress systems get intertwined, so love and fear can both be activated together, making small changes in tone or texting patterns feel like a big threat.",
    whatItFeelsLike:
      "You might panic when someone takes long to reply, replay conversations to see if you offended them, or feel clingy and ashamed about it. You may swing between wanting deep closeness and wanting to pull away before you get hurt.",
    gentleReframes: [
      "Your sensitivity to connection comes from a nervous system that learned to watch for danger in relationships, not from you being ‘too much’.",
      "You are allowed to ask for reassurance and clarity instead of pretending you are always fine.",
      "Building safer relationships is a process; needing security does not make you weak or childish.",
    ],
    triggers: [
      'i am scared they will leave me',
      'i hate being ignored',
      'when they dont text back i panic',
      'when they don’t text back i panic',
      'i always feel like people will leave me',
      'i get attached too quickly',
      'i am too clingy',
      'i feel needy in relationships',
    ],
  },
  {
    id: 'dissociation',
    label: 'Dissociation',
    shortDescription:
      "When you feel disconnected from your body, your surroundings, or your sense of self, like watching life happen from far away.",
    biologicalWhy:
      "Dissociation is the brain’s emergency brake. When emotions or experiences feel too overwhelming, the nervous system may partially ‘switch off’ awareness to protect you from overload. This involves changes in how attention, memory, and body signals are processed, often linked to trauma or chronic stress.",
    whatItFeelsLike:
      "You may feel numb, spaced out, or unreal. Your body can feel far away or robotic, and time may feel blurry. People might say you look ‘zoned out’ while inside you feel like you are not fully here.",
    gentleReframes: [
      "Dissociation is not madness; it is your brain trying to keep you safe when it feels too much.",
      "Grounding skills can slowly give you more choice about when to tune in and when to take space.",
      "You deserve environments and relationships where your nervous system does not have to be in survival mode.",
    ],
    triggers: [
      'i feel detached',
      'i feel like i am watching myself',
      'i am here but i am not here',
      'my body is here but my mind is far',
      'i feel numb and far away',
      'i just space out',
    ],
  },
  {
    id: 'rejection_sensitivity',
    label: 'Rejection Sensitivity',
    shortDescription:
      "When even small signs of criticism, silence, or change in tone feel painfully like rejection or personal attack.",
    biologicalWhy:
      "Rejection sensitivity can be linked to how reward and threat circuits in the brain process social feedback. Past bullying, harsh parenting, or marginalization can train the nervous system to treat small cues—like a delayed reply or neutral face—as proof of danger. In some neurodivergent brains (like ADHD), emotional responses can also be more intense and fast, making rejection feel sharper.",
    whatItFeelsLike:
      "You might replay small comments for days, feel deeply wounded by ‘jokes’, or take neutral feedback as proof you are useless. Your reactions can feel big even to you, and you may judge yourself for ‘overreacting’.",
    gentleReframes: [
      "Your pain around rejection comes from real experiences and a sensitive nervous system, not from you being dramatic for sport.",
      "It is okay to take a pause, soothe yourself, and then check the facts of the situation gently.",
      "You deserve relationships where feedback is kind and where your sensitivity is understood, not mocked.",
    ],
    triggers: [
      'small thing i feel attacked',
      'i feel attacked easily',
      'i overreact when someone corrects me',
      'i take things too personal',
      'i take things too personally',
      'rejection hits me too hard',
      'i cannot handle rejection',
    ],
  },
  {
    id: 'imposter_syndrome',
    label: 'Imposter Syndrome',
    shortDescription:
      "When you often feel like a fraud, doubting your achievements and fearing people will ‘find out’ you are not good enough.",
    biologicalWhy:
      "Imposter feelings can arise when your brain’s error-detection and self-evaluation systems are overactive. In high-pressure or competitive environments, or for people from underrepresented groups, the mind can over-focus on mistakes and underplay successes. Stress hormones and perfectionistic wiring make praise feel suspicious instead of safe.",
    whatItFeelsLike:
      "You might achieve something but immediately think you just got lucky or people are overhyping you. Compliments feel uncomfortable. You live with a quiet fear that one mistake will expose you as not smart or capable enough.",
    gentleReframes: [
      "Doubting yourself does not mean you are faking it; it means your standards and fear are very loud right now.",
      "Evidence of your effort and growth matters more than the loudness of your self-criticism.",
      "You are allowed to own small wins without waiting to become ‘perfect’ first.",
    ],
    triggers: [
      'i feel like a fraud',
      'i do not belong here',
      'i dont belong here',
      'i am not good enough for this role',
      'i just got lucky',
      'they will soon find out i am not that smart',
      'imposter syndrome',
    ],
  },
];


