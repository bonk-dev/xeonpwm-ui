// The useEvent API has not yet been added to React,
// so this is a temporary shim to make this sandbox work.
// You're not expected to write code like this yourself.

import {useCallback, useInsertionEffect, useRef} from "react";

export function useEffectEvent(fn) {
    const ref = useRef(null);
    useInsertionEffect(() => {
        ref.current = fn;
    }, [fn]);
    return useCallback((...args) => {
        const f = ref.current;
        return f(...args);
    }, []);
}