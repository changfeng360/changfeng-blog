import type { Transition, Variants } from "framer-motion";

export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
export const EASE_IN_OUT: [number, number, number, number] = [
  0.77, 0, 0.175, 1,
];

export const SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 24,
  mass: 0.9,
};

export const SPRING_BOUNCE: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 14,
  mass: 0.8,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};
