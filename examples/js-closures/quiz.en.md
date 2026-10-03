---
format: 1
id: js-closures
title: JavaScript closures
description: Scopes, closures and the classic loop pitfall. English only — demonstrates the language fallback.
language: en
generated_at: 2026-10-03
generator: hand-written example
sources:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures
---

## What does this code log?
<!-- id: js-001 | level: 2 | tags: closures -->

```js
function makeCounter() {
  let count = 0;
  return () => ++count;
}
const counter = makeCounter();
counter();
console.log(counter());
```

- [x] `2`
- [ ] `1`
- [ ] `0`
- [ ] `undefined`

> [!explanation]
> The arrow function keeps a reference to the `count` variable of the `makeCounter` call that created it. Each call increments the same variable.

> [!source] link
> [MDN — Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)

## What does this code log after the timers fire?
<!-- id: js-002 | level: 3 | tags: closures, var, loops -->

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
```

- [x] `3`, `3`, `3`
- [ ] `0`, `1`, `2`
- [ ] `2`, `2`, `2`
- [ ] `undefined` three times

> [!explanation]
> `var` is function-scoped: the three callbacks share a single `i`, which equals 3 when they run. Declaring it with `let` creates a new binding per iteration and logs `0`, `1`, `2`.

> [!source] code
> Fixed version, with `let`:
> ```js
> for (let i = 0; i < 3; i++) {
>   setTimeout(() => console.log(i)); // 0, 1, 2
> }
> ```

> [!source] link
> [MDN — Closures: creating closures in loops](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures#creating_closures_in_loops_a_common_mistake)

## A closure is created every time a function is created.
<!-- id: js-003 | level: 1 | type: true-false | answer: true | tags: closures -->

> [!source] link
> [MDN — Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)

## Which keywords declare block-scoped variables?
<!-- id: js-004 | level: 1 | tags: scope -->

- [x] `let`
- [x] `const`
- [ ] `var`
- [ ] `function`

> [!source] link
> [MDN — let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)

> [!source] link
> [MDN — const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
