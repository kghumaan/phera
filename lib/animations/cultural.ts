import { Variants } from 'framer-motion';

// Cultural color palette for animations
export const culturalColors = {
  gold: '#D4AF37',
  maroon: '#800020',
  saffron: '#FF9933',
  coral: '#FF6B6B',
  teal: '#20C997',
  purple: '#6C5CE7',
};

// Floating petals animation
export const petalFloat = {
  animate: {
    y: [0, -20, 0],
    x: [0, 10, -10, 0],
    rotate: [0, 180, 360],
  },
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// RSVP success celebration
export const celebration: Variants = {
  initial: { 
    scale: 0,
    opacity: 0,
  },
  animate: { 
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
    opacity: 1,
  },
  exit: {
    scale: 0,
    opacity: 0,
  }
};

// Staggered container for multiple elements
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  }
};

// Individual staggered items
export const staggerItem: Variants = {
  hidden: { 
    y: 20, 
    opacity: 0 
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Mandala-inspired circular entrance
export const mandalaEntrance: Variants = {
  hidden: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      duration: 0.8,
    }
  }
};

// Gentle fade entrance (for text)
export const fadeInUp: Variants = {
  hidden: {
    y: 30,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Card hover effect
export const cardHover = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)"
  },
  hover: { 
    scale: 1.02,
    y: -4,
    boxShadow: "0px 12px 24px rgba(0,0,0,0.15)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Pulse animation for important elements
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  }
};

// Cultural element floating (like diyas, flowers)
export const culturalFloat = {
  animate: {
    y: [0, -15, 0],
    rotate: [0, 5, -5, 0],
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  }
};

// Success confetti burst
export const confettiBurst: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15,
    }
  },
  exit: {
    scale: 0,
    opacity: 0,
    y: -50,
    transition: {
      duration: 0.5,
    }
  }
};

// Smooth slide in from sides
export const slideIn = {
  left: {
    hidden: { x: -100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  },
  right: {
    hidden: { x: 100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }
};

// Gentle bounce for buttons
export const buttonBounce = {
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  },
  hover: { 
    scale: 1.05,
    transition: { duration: 0.2 }
  }
};

// Loading spinner with cultural flair
export const culturalSpinner = {
  animate: {
    rotate: 360,
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear",
  }
};

// Photo reveal animation
export const photoReveal: Variants = {
  hidden: {
    clipPath: "circle(0% at 50% 50%)",
    opacity: 0,
  },
  visible: {
    clipPath: "circle(100% at 50% 50%)",
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: "easeInOut",
    }
  }
};

// Typing effect for text
export const typewriter: Variants = {
  hidden: {
    width: 0,
  },
  visible: {
    width: "100%",
    transition: {
      duration: 2,
      ease: "easeInOut",
    }
  }
};

// Cultural background patterns animation
export const patternFloat = {
  animate: {
    backgroundPosition: ["0% 0%", "100% 100%"],
  },
  transition: {
    duration: 20,
    repeat: Infinity,
    ease: "linear",
  }
};

// Heart beat for love elements
export const heartBeat = {
  animate: {
    scale: [1, 1.1, 1],
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: "easeInOut",
  }
};

// Sparkle effect
export const sparkle = {
  animate: {
    opacity: [0, 1, 0],
    scale: [0.5, 1, 0.5],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut",
  }
};

// Page transition effects
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  }
};

// Custom easing functions for Indian design
export const customEasing = {
  gentle: [0.25, 0.46, 0.45, 0.94],
  bouncy: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.4, 0, 0.2, 1],
  cultural: [0.25, 0.1, 0.25, 1],
};

// Export commonly used animation presets
export const animationPresets = {
  fadeInUp,
  slideIn,
  staggerContainer,
  staggerItem,
  mandalaEntrance,
  celebration,
  cardHover,
  buttonBounce,
  pulse,
  culturalFloat,
  petalFloat,
  confettiBurst,
  photoReveal,
  heartBeat,
  sparkle,
  pageTransition,
};

// Backward compatibility for existing imports
export const animations = {
  petalFloat: {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, -10, 0],
      rotate: [0, 180, 360],
    },
    transition: {
      duration: 6,
      repeat: Infinity,
    },
  },
  heroFadeIn: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.8,
    },
  },
  buttonHover: {
    whileHover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    whileTap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
  },
  countdownPulse: {
    animate: {
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};

export default animationPresets; 