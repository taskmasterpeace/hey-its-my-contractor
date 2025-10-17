import { Variants } from 'framer-motion'

export const dotVariants: Variants = {
    animate: {
        y: ['0%', '-50%', '0%'],
        transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
}

export const containerVariants = {
    animate: {
        transition: {
            staggerChildren: 0.2,
        },
    },
}

export const mediaPlayerVariants: Variants = {
    initial: {
        rotateX: -90,
        y: 50,
        opacity: 0,
        transformOrigin: 'bottom center',
        perspective: 1200,
    },
    animate: {
        rotateX: 0,
        y: 0,
        opacity: 1,
    },
    exit: {
        rotateX: -90,
        y: 50,
        opacity: 0,
    }
}


export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
}

export const staggerChildren = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
}