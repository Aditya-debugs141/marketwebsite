'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { useEffect } from 'react';

export function MotionDiv(props: HTMLMotionProps<"div">) {
    useEffect(() => {
        console.log('MotionDiv Mounted:', props.className);
    }, [props.className]);
    return <motion.div {...props} />;
}

export function MotionHeader(props: HTMLMotionProps<"header">) {
    return <motion.header {...props} />;
}

export function MotionSection(props: HTMLMotionProps<"section">) {
    return <motion.section {...props} />;
}
