---
format: 1
id: ts-async
title: La programmation asynchrone en TypeScript
description: Promesses, async/await, boucle d'évènements, typage, itération asynchrone, annulation et pièges courants.
language: fr
generated_at: 2026-10-03
generator: quiz-generator
sources:
  - https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise
  - https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
  - https://www.typescriptlang.org/docs/handbook/release-notes/overview.html
  - https://typescript-eslint.io/rules/
  - https://unpkg.com/typescript@5.9.3/lib/
---

# La programmation asynchrone en TypeScript

## Quel est l'état initial d'une promesse, avant qu'elle soit complétée ou rompue ?
<!-- id: tsa-001 | level: 1 | tags: promesses -->

- [x] En attente (*pending*)
- [ ] Résolue (*resolved*)
- [ ] Acquittée (*settled*)
- [ ] Suspendue (*suspended*)

> [!explanation]
> Une promesse commence en attente, puis devient complétée (*fulfilled*) ou rompue (*rejected*). « Acquittée » désigne justement la sortie de l'état d'attente.

> [!source] excerpt
> « pending (en attente) : état initial, la promesse n'est ni complétée, ni rompue. »
> — [MDN — Promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise)

## Que signifie qu'une promesse est « acquittée » (*settled*) ?
<!-- id: tsa-002 | level: 1 | tags: promesses -->

- [x] Elle est complétée ou rompue, mais n'est plus en attente
- [ ] Elle est complétée avec une valeur, et seulement dans ce cas
- [ ] Un gestionnaire `then()` lui a été attaché
- [ ] Sa valeur a été lue par une expression `await`

> [!source] excerpt
> « Une promesse est dite acquittée (settled en anglais) si elle est soit complétée, soit rompue, mais pas en attente. »
> — [MDN — Promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise)

## Une promesse est résolue avec une autre promesse encore en attente. Dans quel état est-elle ?
<!-- id: tsa-003 | level: 3 | tags: promesses -->

- [x] Résolue, mais pas encore acquittée : son état suit celui de l'autre promesse
- [ ] Complétée, avec pour valeur la promesse en attente
- [ ] Rompue, car une promesse ne peut pas contenir une promesse
- [ ] Acquittée, puisque sa fonction `resolve` a été appelée

> [!explanation]
> « Résolue » ne veut pas dire « complétée » : la promesse est verrouillée sur l'autre et ne sera acquittée que lorsque celle-ci le sera.

> [!source] excerpt
> « Notez que si vous appelez `resolveFunc` et passez un autre objet promesse en argument, la promesse initiale peut être considérée comme « résolue », mais pas encore « acquittée » »
> — [MDN — constructeur Promise()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)

## La fonction exécutrice passée à `new Promise(executor)` est appelée de manière synchrone, pendant la construction de la promesse.
<!-- id: tsa-004 | level: 1 | type: true-false | answer: true | tags: promesses -->

> [!explanation]
> Le code de l'exécuteur s'exécute tout de suite ; seuls les gestionnaires `then()` sont différés.

> [!source] excerpt
> « Un `executor` est appelé de manière synchrone (dès que le `Promise` est construit) avec les fonctions `resolveFunc` et `rejectFunc` comme arguments. »
> — [MDN — constructeur Promise()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)

## Que se passe-t-il si la fonction exécutrice lève une erreur avant d'avoir appelé `resolve` ou `reject` ?
<!-- id: tsa-005 | level: 2 | tags: promesses, erreurs -->

- [x] La promesse est rompue avec cette erreur
- [ ] L'erreur remonte de façon synchrone à l'appelant de `new Promise()`
- [ ] La promesse reste en attente indéfiniment
- [ ] La promesse est complétée avec la valeur `undefined`

> [!source] excerpt
> « Toute erreur levée dans un `executor` provoque le rejet de la promesse, et la valeur de retour est ignorée. »
> — [MDN — constructeur Promise()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)

## Quel est l'effet de `return 42;` dans la fonction exécutrice d'une promesse ?
<!-- id: tsa-006 | level: 2 | tags: promesses -->

```ts
const p = new Promise<number>((resolve) => {
  return 42;
});
```

- [x] Aucun sur la promesse : la valeur de retour est ignorée et `p` reste en attente
- [ ] `p` est complétée avec la valeur `42`
- [ ] `p` est rompue, car l'exécuteur ne doit rien retourner
- [ ] TypeScript refuse de compiler ce code

> [!explanation]
> Seuls les appels à `resolve` ou `reject` changent l'état de la promesse. Ici, aucun n'est fait.

> [!source] excerpt
> « La valeur de retour d'un `executor` est ignorée. »
> — [MDN — constructeur Promise()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)

## Que se passe-t-il si on appelle `Promise(executor)` sans le mot-clé `new` ?
<!-- id: tsa-007 | level: 1 | tags: promesses, erreurs -->

- [x] Une `TypeError` est levée
- [ ] Une promesse est créée normalement
- [ ] L'exécuteur est appelé, mais aucune promesse n'est retournée
- [ ] Une promesse déjà rompue est retournée

> [!source] excerpt
> « `Promise()` ne peut être construit qu'avec new. Tenter de l'appeler sans `new` génère une TypeError. »
> — [MDN — constructeur Promise()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)

## Que retourne la méthode `then()` d'une promesse ?
<!-- id: tsa-008 | level: 1 | tags: promesses -->

- [x] Une nouvelle promesse, retournée immédiatement
- [ ] La même promesse, pour permettre le chaînage
- [ ] La valeur de complétion, une fois disponible
- [ ] `undefined` : `then()` ne sert qu'à enregistrer un gestionnaire

> [!source] excerpt
> « Retourne une nouvelle promesse (Promise) immédiatement. Cette promesse retournée est toujours en attente lorsqu'elle est retournée, quel que soit l'état de la promesse actuelle. »
> — [MDN — Promise.prototype.then()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)

## Le gestionnaire passé à `p.then(gestionnaire)` lève une erreur. Que devient la promesse retournée par `then()` ?
<!-- id: tsa-009 | level: 2 | tags: promesses, erreurs -->

- [x] Elle est rompue avec l'erreur levée
- [ ] Elle est complétée avec `undefined`
- [ ] Elle reste en attente indéfiniment
- [ ] L'erreur est levée de façon synchrone dans le code appelant

> [!source] excerpt
> « lance une erreur : `p` est rompue avec l'erreur lancée comme sa valeur. »
> — [MDN — Promise.prototype.then()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)

## Le gestionnaire passé à `then()` ne retourne rien. Avec quelle valeur la promesse retournée par `then()` est-elle complétée ?
<!-- id: tsa-010 | level: 1 | tags: promesses -->

- [x] `undefined`
- [ ] La valeur de la promesse d'origine
- [ ] `null`
- [ ] Elle n'est jamais complétée

> [!source] excerpt
> « ne retourne rien : `p` est complétée avec `undefined` comme sa valeur. »
> — [MDN — Promise.prototype.then()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)

## Un gestionnaire `then()` attaché à une promesse déjà complétée s'exécute de manière asynchrone, après le code synchrone en cours.
<!-- id: tsa-011 | level: 2 | type: true-false | answer: true | tags: promesses, boucle-evenements -->

> [!explanation]
> Même pour une promesse déjà acquittée, le gestionnaire est placé dans la file des micro-tâches et s'exécute après la fin du code synchrone en cours.

> [!source] excerpt
> « L'appel se produit toujours de manière asynchrone, même lorsque la promesse actuelle est déjà acquittée »
> — [MDN — Promise.prototype.then()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)

## À quel appel `p.catch(onRejected)` est-il équivalent ?
<!-- id: tsa-012 | level: 1 | tags: promesses, erreurs -->

- [x] `p.then(undefined, onRejected)`
- [ ] `p.then(onRejected)`
- [ ] `p.finally(onRejected)`
- [ ] `p.then(onRejected, onRejected)`

> [!source] excerpt
> « C'est un raccourci pour then(undefined, onRejected). »
> — [MDN — Promise.prototype.catch()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch)

## Quelle est la valeur finale de `Promise.resolve(2).finally(() => 77)` ?
<!-- id: tsa-013 | level: 2 | tags: promesses -->

- [x] Une promesse complétée avec `2`
- [ ] Une promesse complétée avec `77`
- [ ] Une promesse complétée avec `undefined`
- [ ] Une promesse rompue avec `77`

> [!explanation]
> `finally()` est transparent : la valeur retournée par son callback est ignorée, et la promesse garde l'état de la promesse d'origine.

> [!source] excerpt
> « Contrairement à `Promise.resolve(2).then(() => 77, () => 77)`, qui retourne une promesse finalement complétée avec la valeur `77`, `Promise.resolve(2).finally(() => 77)` retourne une promesse finalement complétée avec la valeur `2`. »
> — [MDN — Promise.prototype.finally()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally)

## Que donne `Promise.reject(3).finally(() => { throw 99; })` ?
<!-- id: tsa-014 | level: 3 | tags: promesses, erreurs -->

- [x] Une promesse rompue avec la raison `99`
- [ ] Une promesse rompue avec la raison `3`
- [ ] Une promesse complétée avec `99`
- [ ] Une promesse complétée avec `3`

> [!explanation]
> `finally()` reflète normalement l'état d'origine, sauf si son callback lève une erreur ou retourne une promesse rompue : c'est alors cette nouvelle raison qui l'emporte.

> [!source] excerpt
> « Un `throw` (ou le retour d'une promesse rompue) dans la fonction de rappel `finally` entraîne toujours le rejet de la promesse retournée. »
> — [MDN — Promise.prototype.finally()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally)

## Quels arguments reçoit la fonction passée à `finally()` ?
<!-- id: tsa-015 | level: 1 | tags: promesses -->

- [x] Aucun argument
- [ ] La valeur de complétion ou la raison du rejet
- [ ] Un objet `{ status, value }` décrivant le résultat
- [ ] La promesse d'origine

> [!source] excerpt
> « La fonction de rappel `onFinally` ne reçoit aucun argument. »
> — [MDN — Promise.prototype.finally()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally)

## Appeler deux fois `then()` sur la même promesse (au lieu de chaîner) fait attendre le second gestionnaire jusqu'à ce que le premier ait fini.
<!-- id: tsa-016 | level: 2 | type: true-false | answer: false | tags: promesses -->

> [!explanation]
> Les deux gestionnaires sont appelés dans l'ordre d'ajout, mais chaque `then()` démarre sa propre chaîne : aucune n'attend l'autre.

> [!source] excerpt
> « De plus, les deux promesses retournées par chaque appel de `then()` démarrent des chaînes séparées et n'attendent pas l'acquittement de l'autre. »
> — [MDN — Promise.prototype.then()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)

## `p` est une `Promise` native. Que retourne `Promise.resolve(p)` ?
<!-- id: tsa-017 | level: 2 | tags: promesses -->

- [x] `p` elle-même, sans créer de nouvelle promesse
- [ ] Une nouvelle promesse qui adopte l'état de `p`
- [ ] Une promesse complétée avec `p` comme valeur
- [ ] Une promesse déjà complétée, quel que soit l'état de `p`

> [!source] excerpt
> « Si `value` appartient à `Promise` ou à une sous-classe, et que `value.constructor === Promise`, alors `value` est directement retourné par `Promise.resolve()`, sans créer une nouvelle instance de `Promise`. »
> — [MDN — Promise.resolve()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)

## `charger()` lève une erreur de manière synchrone. Que fait `Promise.resolve(charger())` ?
<!-- id: tsa-018 | level: 3 | tags: promesses, erreurs -->

- [x] L'erreur est levée de façon synchrone, aucune promesse n'est créée
- [ ] Il retourne une promesse rompue avec cette erreur
- [ ] Il retourne une promesse complétée avec l'erreur
- [ ] Il retourne une promesse qui reste en attente

> [!explanation]
> L'argument est évalué avant l'appel à `Promise.resolve()`, qui ne peut donc pas intercepter l'erreur. `Promise.try(() => charger())` règle ce cas.

> [!source] excerpt
> « Si l'évaluation de l'expression `value` peut lever une erreur de manière synchrone, cette erreur n'est pas interceptée et encapsulée dans une promesse rompue par `Promise.resolve()`. Dans ce cas, envisagez d'utiliser Promise.try(() => value). »
> — [MDN — Promise.resolve()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)

## Que retourne `Promise.try(() => { throw new Error("x"); })` ?
<!-- id: tsa-019 | level: 2 | tags: promesses, erreurs -->

- [x] Une promesse déjà rompue avec l'erreur
- [ ] Rien : l'erreur est levée de façon synchrone
- [ ] Une promesse complétée avec l'objet `Error`
- [ ] Une promesse qui reste en attente

> [!source] excerpt
> « Already rejected, if `func` synchronously throws an error. »
> — [MDN — Promise.try()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/try)

## Comment annuler une opération asynchrone représentée par une promesse ?
<!-- id: tsa-020 | level: 1 | tags: promesses, annulation -->

- [x] En annulant l'opération sous-jacente, généralement avec un `AbortController`
- [ ] En appelant la méthode `cancel()` de la promesse
- [ ] En appelant `Promise.reject()` sur la promesse en cours
- [ ] En supprimant toutes les références à la promesse

> [!explanation]
> Une promesse n'est qu'un résultat futur : elle n'a pas de mécanisme d'annulation. Il faut agir sur l'opération elle-même (requête `fetch`, flux…).

> [!source] excerpt
> « Une promesse (`Promise`) ne dispose pas en soi d'un protocole de premier niveau pour l'annulation, mais vous pouvez éventuellement annuler directement l'opération asynchrone sous-jacente, généralement à l'aide de AbortController. »
> — [MDN — Promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise)

## Des promesses en attente empêchent un programme de se terminer tant qu'elles ne sont pas acquittées.
<!-- id: tsa-021 | level: 2 | type: true-false | answer: false | tags: promesses, boucle-evenements -->

> [!explanation]
> Une promesse ne maintient pas le programme en vie : ce sont les tâches planifiées (minuteurs, entrées/sorties…) qui le font. Si plus rien n'est planifié, les promesses restent en attente pour toujours.

> [!source] excerpt
> « L'existence de promesses en attente n'empêche pas le programme de se terminer. »
> — [MDN — constructeur Promise()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)

## Comment appelle-t-on un objet qui possède une méthode `then`, comme une promesse ?
<!-- id: tsa-022 | level: 1 | tags: promesses -->

- [x] Un *thenable* (semi-promesse)
- [ ] Un *awaitable*
- [ ] Un *future*
- [ ] Un *observable*

> [!source] excerpt
> « A "Thenable" value is an object which has a `then` method, such as a Promise. »
> — [typescript-eslint — await-thenable](https://typescript-eslint.io/rules/await-thenable)

## Dans une chaîne `then()`, un gestionnaire lance une opération asynchrone sans retourner sa promesse. Quelle est la conséquence ?
<!-- id: tsa-023 | level: 2 | tags: promesses, pieges -->

- [x] La promesse devient « flottante » : son résultat et ses erreurs ne sont plus suivis
- [ ] Le `then()` suivant attend quand même la fin de l'opération
- [ ] L'opération est annulée à la fin du gestionnaire
- [ ] Une erreur est levée car un gestionnaire doit retourner une valeur

> [!explanation]
> Le `then()` suivant est appelé trop tôt et une éventuelle erreur de l'opération n'est interceptée par personne.

> [!source] excerpt
> « If the previous handler started a promise but did not return it, there's no way to track its settlement anymore, and the promise is said to be "floating". »
> — [MDN — Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)

## Quand la promesse retournée par `Promise.all()` est-elle rompue ?
<!-- id: tsa-024 | level: 1 | tags: combinateurs -->

- [x] Dès qu'une des promesses d'entrée est rompue, avec la raison de ce premier rejet
- [ ] Quand toutes les promesses d'entrée sont rompues
- [ ] Quand toutes les promesses sont acquittées et qu'au moins une est rompue
- [ ] Jamais : elle est toujours complétée avec un tableau de résultats

> [!source] excerpt
> « Elle est rompue (rejected en anglais) lorsqu'une des promesses de l'entrée est rompue, avec la raison de ce premier rejet. »
> — [MDN — Promise.all()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

## Que retourne `Promise.all([])`, appelé avec un tableau vide ?
<!-- id: tsa-025 | level: 2 | tags: combinateurs -->

- [x] Une promesse déjà complétée (avec un tableau vide)
- [ ] Une promesse qui reste en attente indéfiniment
- [ ] Une promesse rompue avec une `AggregateError`
- [ ] Une `TypeError` levée de façon synchrone

> [!source] excerpt
> « Déjà complétée, si un `iterable` vide est passé en argument. »
> — [MDN — Promise.all()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

## Dans quel ordre sont rangées les valeurs du tableau fourni par `Promise.all()` ?
<!-- id: tsa-026 | level: 1 | tags: combinateurs -->

- [x] Dans l'ordre des promesses passées en entrée
- [ ] Dans l'ordre de complétion des promesses
- [ ] Dans l'ordre inverse de complétion
- [ ] Dans un ordre non spécifié

> [!source] excerpt
> « La valeur de complétion est un tableau des valeurs de complétion, dans l'ordre des promesses passées, indépendamment de l'ordre de complétion. »
> — [MDN — Promise.all()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

## Quand `Promise.all()` est rompue, les autres opérations encore en cours continuent de s'exécuter.
<!-- id: tsa-027 | level: 2 | type: true-false | answer: true | tags: combinateurs, annulation -->

> [!explanation]
> Elles ne sont pas annulées ; seul leur résultat n'est plus accessible via `Promise.all()`. Pour les arrêter, il faut un mécanisme d'annulation comme `AbortController`.

> [!source] excerpt
> « If one of the promises in the array rejects, `Promise.all()` immediately rejects the returned promise. The other operations continue to run, but their outcomes are not available via the return value of `Promise.all()`. »
> — [MDN — Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)

## Quelles valeurs peut prendre la propriété `status` d'un résultat de `Promise.allSettled()` ?
<!-- id: tsa-028 | level: 1 | tags: combinateurs, typage -->

Sélectionnez toutes les bonnes réponses.

- [x] `"fulfilled"`
- [x] `"rejected"`
- [ ] `"pending"`
- [ ] `"resolved"`

> [!explanation]
> `allSettled()` attend que toutes les promesses soient acquittées : aucune n'est donc encore en attente.

> [!source] code
> [`typescript@5.9.3/lib/lib.es2020.promise.d.ts:19-29`](https://unpkg.com/typescript@5.9.3/lib/lib.es2020.promise.d.ts)
> ```ts
> interface PromiseFulfilledResult<T> {
>     status: "fulfilled";
>     value: T;
> }
>
> interface PromiseRejectedResult {
>     status: "rejected";
>     reason: any;
> }
>
> type PromiseSettledResult<T> = PromiseFulfilledResult<T> | PromiseRejectedResult;
> ```

## En TypeScript, comment accéder sans erreur de typage à `value` sur un élément `r` de type `PromiseSettledResult<number>` ?
<!-- id: tsa-029 | level: 3 | tags: combinateurs, typage -->

- [x] En vérifiant d'abord `r.status === "fulfilled"`, ce qui affine le type
- [ ] Directement : `value` existe sur les deux variantes du type
- [ ] En vérifiant d'abord `r.value !== undefined`
- [ ] En vérifiant d'abord `r instanceof PromiseFulfilledResult`

> [!explanation]
> `PromiseSettledResult` est une union discriminée par `status`. `PromiseFulfilledResult` est une interface, pas une classe : `instanceof` est impossible.

> [!source] code
> [`typescript@5.9.3/lib/lib.es2020.promise.d.ts:19-29`](https://unpkg.com/typescript@5.9.3/lib/lib.es2020.promise.d.ts)
> ```ts
> interface PromiseFulfilledResult<T> {
>     status: "fulfilled";
>     value: T;
> }
>
> interface PromiseRejectedResult {
>     status: "rejected";
>     reason: any;
> }
>
> type PromiseSettledResult<T> = PromiseFulfilledResult<T> | PromiseRejectedResult;
> ```

## Avec quoi la promesse retournée par `Promise.race()` s'acquitte-t-elle ?
<!-- id: tsa-030 | level: 1 | tags: combinateurs -->

- [x] Avec l'état final de la première promesse acquittée, réussie ou rompue
- [ ] Avec la valeur de la première promesse complétée, en ignorant les rejets
- [ ] Avec un tableau des valeurs, dans l'ordre d'arrivée
- [ ] Avec la valeur de la dernière promesse acquittée

> [!source] excerpt
> « Cette promesse retournée se résout avec l'état final de la première promesse qui est acquittée (settle en anglais). »
> — [MDN — Promise.race()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)

## Que retourne `Promise.race([])`, appelé avec un tableau vide ?
<!-- id: tsa-031 | level: 2 | tags: combinateurs -->

- [x] Une promesse qui reste en attente indéfiniment
- [ ] Une promesse déjà complétée avec `undefined`
- [ ] Une promesse rompue avec une `AggregateError`
- [ ] Une `TypeError` levée de façon synchrone

> [!source] excerpt
> « La promesse retournée reste en attente indéfiniment si l'itérable passé est vide. »
> — [MDN — Promise.race()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)

## Que fait `Promise.any()` face aux promesses rompues ?
<!-- id: tsa-032 | level: 1 | tags: combinateurs -->

- [x] Il les ignore jusqu'à la première promesse complétée
- [ ] Il est rompu dès la première promesse rompue
- [ ] Il les range dans un tableau de résultats
- [ ] Il les relance une seconde fois

> [!source] excerpt
> « Elle ignore toutes les promesses rompues jusqu'à la première promesse qui est complétée. »
> — [MDN — Promise.any()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)

## Toutes les promesses passées à `Promise.any()` sont rompues. Que devient la promesse retournée ?
<!-- id: tsa-033 | level: 2 | tags: combinateurs, erreurs -->

- [x] Elle est rompue avec une `AggregateError` regroupant les raisons
- [ ] Elle est rompue avec la raison du premier rejet
- [ ] Elle est complétée avec un tableau des raisons
- [ ] Elle reste en attente indéfiniment

> [!source] excerpt
> « Elle est rompue (rejected en anglais) lorsque toutes les promesses de l'itérable sont rompues (y compris lorsque l'itérable est vide), avec un objet AggregateError contenant un tableau des raisons de rejet. »
> — [MDN — Promise.any()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)

## `Promise.any([])` et `Promise.all([])` se comportent de la même façon avec un tableau vide.
<!-- id: tsa-034 | level: 3 | type: true-false | answer: false | tags: combinateurs -->

> [!explanation]
> `Promise.all([])` est déjà complétée avec `[]`, alors que `Promise.any([])` est rompue : aucun élément ne peut se compléter.

> [!source] excerpt
> « Notez une autre différence : cette méthode rompt la promesse lorsqu'elle reçoit un itérable vide, car, en réalité, l'itérable ne contient aucun élément qui se complète. »
> — [MDN — Promise.any()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)

## Quelle propriété d'une `AggregateError` contient les erreurs regroupées ?
<!-- id: tsa-035 | level: 1 | tags: combinateurs, erreurs -->

- [x] `errors`
- [ ] `causes`
- [ ] `reasons`
- [ ] `inner`

> [!source] code
> [`typescript@5.9.3/lib/lib.es2021.promise.d.ts:19-21`](https://unpkg.com/typescript@5.9.3/lib/lib.es2021.promise.d.ts)
> ```ts
> interface AggregateError extends Error {
>     errors: any[];
> }
> ```

> [!source] link
> [MDN — AggregateError](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/AggregateError)

## Une application interroge trois serveurs miroirs et veut la première réponse réussie, en ignorant les serveurs en panne. Quelle méthode utiliser ?
<!-- id: tsa-036 | level: 3 | tags: combinateurs -->

- [x] `Promise.any()`
- [ ] `Promise.race()`
- [ ] `Promise.all()`
- [ ] `Promise.allSettled()`

> [!explanation]
> `race()` s'arrêterait sur le premier serveur en panne s'il répond le plus vite. `any()` ignore les rejets jusqu'à la première réussite.

> [!source] excerpt
> « De plus, contrairement à Promise.race(), qui retourne la première valeur complétée (qu'il s'agisse d'un accomplissement ou d'un rejet), cette méthode retourne la première valeur accomplie. »
> — [MDN — Promise.any()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)

## Un script lance dix sauvegardes et doit afficher un rapport indiquant, pour chacune, si elle a réussi ou échoué. Quelle méthode utiliser ?
<!-- id: tsa-037 | level: 2 | tags: combinateurs -->

- [x] `Promise.allSettled()`
- [ ] `Promise.all()`
- [ ] `Promise.any()`
- [ ] `Promise.race()`

> [!explanation]
> `Promise.all()` s'arrêterait au premier échec ; `allSettled()` attend toutes les opérations et décrit chaque résultat.

> [!source] excerpt
> « Utilisez `allSettled()` si vous avez besoin du résultat final de chaque promesse de l'itérable d'entrée. »
> — [MDN — Promise.all()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

## Avec `Promise.race([charger(), delai(5000)])`, le délai gagne. Que devient l'opération `charger()` ?
<!-- id: tsa-038 | level: 3 | tags: combinateurs, annulation -->

- [x] Elle continue de s'exécuter en arrière-plan
- [ ] Elle est annulée automatiquement
- [ ] Elle est rompue avec une `TimeoutError`
- [ ] Elle est mise en pause jusqu'au prochain appel

> [!explanation]
> `race()` ne fait que choisir un résultat. Pour réellement interrompre `charger()`, il faut lui passer un `AbortSignal`, par exemple `AbortSignal.timeout(5000)`.

> [!source] excerpt
> « Acquitter la promesse retournée ne supprime pas les autres opérations ni ne désabonne les gestionnaires attachés à leurs promesses. »
> — [MDN — Promise.race()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)

## Que retourne `Promise.withResolvers<T>()` ?
<!-- id: tsa-039 | level: 2 | tags: combinateurs, typage -->

- [x] Un objet `{ promise, resolve, reject }`
- [ ] Un tuple `[promise, resolve, reject]`
- [ ] Une promesse déjà complétée
- [ ] Une fonction qui crée une nouvelle promesse à chaque appel

> [!explanation]
> Cela évite d'extraire `resolve` et `reject` de l'exécuteur à la main quand on doit les appeler ailleurs.

> [!source] code
> [`typescript@5.9.3/lib/lib.es2024.promise.d.ts:19-34`](https://unpkg.com/typescript@5.9.3/lib/lib.es2024.promise.d.ts)
> ```ts
> interface PromiseWithResolvers<T> {
>     promise: Promise<T>;
>     resolve: (value: T | PromiseLike<T>) => void;
>     reject: (reason?: any) => void;
> }
> // …
>     withResolvers<T>(): PromiseWithResolvers<T>;
> ```

## `Promise.all([f(), g(), h()])` exécute `f()`, `g()` et `h()` l'une après l'autre.
<!-- id: tsa-040 | level: 1 | type: true-false | answer: false | tags: combinateurs -->

> [!explanation]
> Les trois appels sont faits immédiatement, pendant la construction du tableau : les opérations tournent en même temps. `Promise.all()` se contente d'attendre leurs résultats.

> [!source] excerpt
> « These methods all run promises concurrently — a sequence of promises are started simultaneously and do not wait for each other. »
> — [MDN — Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)

## Quel est le type de `resultats` dans ce code ?
<!-- id: tsa-041 | level: 2 | tags: combinateurs, typage -->

```ts
declare function age(): Promise<number>;
declare function nom(): Promise<string>;

const resultats = await Promise.all([age(), nom()]);
```

- [x] `[number, string]`
- [ ] `(number | string)[]`
- [ ] `[Promise<number>, Promise<string>]`
- [ ] `Promise<[number, string]>`

> [!explanation]
> Pour un tableau littéral, `Promise.all` conserve la forme du tuple et applique `Awaited` à chaque élément ; `await` retire ensuite la promesse englobante.

> [!source] code
> [`typescript@5.9.3/lib/lib.es2015.promise.d.ts:39`](https://unpkg.com/typescript@5.9.3/lib/lib.es2015.promise.d.ts)
> ```ts
> all<T extends readonly unknown[] | []>(values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]>; }>;
> ```

## Quel est le type de `premier` dans ce code ?
<!-- id: tsa-042 | level: 3 | tags: combinateurs, typage -->

```ts
declare const a: Promise<number>;
declare const b: Promise<string>;

const premier = await Promise.race([a, b]);
```

- [x] `number | string`
- [ ] `[number, string]`
- [ ] `number`
- [ ] `unknown`

> [!explanation]
> On ne sait pas à l'avance quelle promesse gagnera : le résultat est l'union des types attendus.

> [!source] code
> [`typescript@5.9.3/lib/lib.es2015.promise.d.ts:50`](https://unpkg.com/typescript@5.9.3/lib/lib.es2015.promise.d.ts)
> ```ts
> race<T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>>;
> ```

## Que retourne toujours une fonction déclarée avec `async` ?
<!-- id: tsa-043 | level: 1 | tags: async-await -->

- [x] Une promesse
- [ ] La valeur de son instruction `return`
- [ ] Un générateur
- [ ] `undefined` tant que son corps n'est pas terminé

> [!source] excerpt
> « Async functions always return a promise. »
> — [MDN — async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

## Que se passe-t-il si une exception non interceptée est levée dans une fonction `async` ?
<!-- id: tsa-044 | level: 1 | tags: async-await, erreurs -->

- [x] La promesse retournée par la fonction est rompue avec cette exception
- [ ] L'exception remonte de façon synchrone à l'appelant
- [ ] L'exception est ignorée et la promesse est complétée
- [ ] Le programme s'arrête immédiatement

> [!source] excerpt
> « Une promesse (Promise) qui sera résolue avec la valeur renvoyée par la fonction asynchrone ou qui sera rompue s'il y a une exception non interceptée émise depuis la fonction asynchrone. »
> — [MDN — async function](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/async_function)

## Où le mot-clé `await` peut-il être utilisé ?
<!-- id: tsa-045 | level: 1 | tags: async-await -->

Sélectionnez toutes les bonnes réponses.

- [x] Dans le corps d'une fonction `async`
- [x] Au niveau supérieur d'un module
- [ ] Dans n'importe quelle fonction, même non `async`
- [ ] Au niveau supérieur d'un script classique (non module)

> [!source] excerpt
> « Il ne peut être utilisé qu'à l'intérieur d'une fonction asynchrone ou au niveau supérieur d'un module. »
> — [MDN — await](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await)

## Que fait `await 42`, appliqué à une valeur qui n'est pas une promesse ?
<!-- id: tsa-046 | level: 2 | tags: async-await, boucle-evenements -->

- [x] Il donne `42`, mais suspend quand même la fonction jusqu'à une micro-tâche suivante
- [ ] Il donne `42` immédiatement, sans suspendre la fonction
- [ ] Il lève une `TypeError`, car 42 n'est pas une promesse
- [ ] Il donne une promesse complétée avec `42`

> [!source] excerpt
> « If the `await` keyword is used on a value that is not a Thenable, the value is directly resolved, but will still pause execution until the next microtask. »
> — [typescript-eslint — await-thenable](https://typescript-eslint.io/rules/await-thenable)

## Que fait `await` sur une promesse qui est rompue ?
<!-- id: tsa-047 | level: 1 | tags: async-await, erreurs -->

- [x] Il lève la raison du rejet, qu'un `try...catch` peut intercepter
- [ ] Il retourne `undefined`
- [ ] Il retourne un objet `{ status: "rejected", reason }`
- [ ] Il attend indéfiniment que la promesse soit complétée

> [!source] excerpt
> « Si la promesse est rompue, l'expression `await` lève la valeur de rejet. »
> — [MDN — await](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await)

## `await` suspend seulement la fonction `async` en cours, sans bloquer le thread principal.
<!-- id: tsa-048 | level: 1 | type: true-false | answer: true | tags: async-await, boucle-evenements -->

> [!explanation]
> Pendant l'attente, le reste du programme (autres tâches, évènements) continue de s'exécuter.

> [!source] excerpt
> « l'expression `await` ne bloque jamais le thread principal et ne fait que différer l'exécution du code qui dépend réellement du résultat »
> — [MDN — await](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await)

## `attendre2s()` et `attendre1s()` retournent des promesses complétées après 2 s et 1 s. Combien de temps prend ce code, au minimum ?
<!-- id: tsa-049 | level: 2 | tags: async-await, performance -->

```ts
const lente = await attendre2s();
const rapide = await attendre1s();
```

- [x] Environ 3 secondes
- [ ] Environ 2 secondes
- [ ] Environ 1 seconde
- [ ] Aucun temps : les deux promesses sont déjà résolues

> [!explanation]
> Le second minuteur n'est créé qu'après la fin du premier `await` : les durées s'additionnent.

> [!source] excerpt
> « Le deuxième minuteur n'est pas créé tant que le premier n'est pas écoulé. Le code s'exécute donc au moins en 3 secondes. »
> — [MDN — async function](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/async_function)

## Mêmes fonctions qu'avec `attendre2s()`/`attendre1s()`, mais les deux promesses sont créées avant d'être attendues. Combien de temps prend ce code, au minimum ?
<!-- id: tsa-050 | level: 3 | tags: async-await, performance -->

```ts
const pLente = attendre2s();
const pRapide = attendre1s();
const lente = await pLente;
const rapide = await pRapide;
```

- [x] Environ 2 secondes
- [ ] Environ 3 secondes
- [ ] Environ 1 seconde
- [ ] Environ 1,5 seconde

> [!explanation]
> Les deux minuteurs démarrent en même temps ; quand le premier `await` se termine, le second est déjà fini.

> [!source] excerpt
> « Avec `concurrentStart`, les deux minuteurs sont créés puis attendus derrière un `await` Les minuteurs sont exécutés de façon concurrente. L'ensemble du code se termine donc en au moins 2 secondes plutôt qu'en 3 secondes. »
> — [MDN — async function](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/async_function)

## Quelle écriture lance deux tâches indépendantes en même temps et attend leurs deux résultats ?
<!-- id: tsa-051 | level: 2 | tags: async-await, combinateurs, performance -->

- [x] `const [a, b] = await Promise.all([tache1(), tache2()]);`
- [ ] `const a = await tache1(); const b = await tache2();`
- [ ] `const [a, b] = [await tache1(), await tache2()];`
- [ ] `const [a, b] = await Promise.race([tache1(), tache2()]);`

> [!explanation]
> Dans la deuxième et la troisième réponse, `tache2()` n'est appelée qu'après la fin de `tache1()`. `race()` ne donne qu'un seul résultat.

> [!source] excerpt
> « Si on souhaite avoir deux tâches qui s'exécutent réellement en parallèle, on pourra utiliser `await Promise.all([job1(), job2()])` »
> — [MDN — async function](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/async_function)

## Dans quel ordre ce code affiche-t-il ses messages ?
<!-- id: tsa-052 | level: 3 | tags: async-await, boucle-evenements -->

```ts
async function toto(nom: string) {
  console.log(nom, "début");
  await console.log(nom, "milieu");
  console.log(nom, "fin");
}
toto("Première");
toto("Deuxième");
```

- [x] Première début, Première milieu, Deuxième début, Deuxième milieu, Première fin, Deuxième fin
- [ ] Première début, Première milieu, Première fin, Deuxième début, Deuxième milieu, Deuxième fin
- [ ] Première début, Deuxième début, Première milieu, Deuxième milieu, Première fin, Deuxième fin
- [ ] Première début, Première milieu, Deuxième début, Deuxième milieu, Deuxième fin, Première fin

> [!explanation]
> L'expression attendue (`console.log(nom, "milieu")`) s'exécute tout de suite ; seule la suite de la fonction est reportée à une micro-tâche. Les deux suites s'exécutent ensuite dans l'ordre où elles ont été planifiées.

> [!source] code
> [MDN — await : observer les effets de `await` sur le flux](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await#observer_les_effets_de_await_sur_le_flux)
> ```js
> // Première début
> // Première milieu
> // Deuxième début
> // Deuxième milieu
> // Première fin
> // Deuxième fin
> ```

## Une fonction `async` ne contient aucune expression `await`. Quand son corps s'exécute-t-il ?
<!-- id: tsa-053 | level: 2 | tags: async-await, boucle-evenements -->

- [x] Entièrement et de façon synchrone, au moment de l'appel
- [ ] Au prochain tour de la boucle d'évènements
- [ ] Dans une micro-tâche, après la fin du code appelant
- [ ] Seulement quand un appelant attend sa promesse avec `await`

> [!explanation]
> Elle retourne quand même une promesse, mais tout son code s'exécute pendant l'appel.

> [!source] excerpt
> « Dans ce cas, la fonction `toto` est synchrone en pratique, car elle ne contient aucune expression `await`. »
> — [MDN — await](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await)

## Qu'affiche ce code ?
<!-- id: tsa-054 | level: 2 | tags: async-await, boucle-evenements -->

```ts
async function f() {
  console.log(1);
  await null;
  console.log(2);
}
f();
console.log(3);
```

- [x] 1, 3, 2
- [ ] 1, 2, 3
- [ ] 3, 1, 2
- [ ] 1, 3, puis rien

> [!explanation]
> `f()` s'exécute de façon synchrone jusqu'au premier `await`, puis rend la main : `3` s'affiche avant la reprise de `f`.

> [!source] excerpt
> « Cependant, dès qu'un `await` apparaît, la fonction devient asynchrone et l'exécution des instructions suivantes est reportée au cycle suivant. »
> — [MDN — await](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await)

## Quand une fonction `async` est suspendue sur un `await`, la fonction qui l'a appelée continue son exécution.
<!-- id: tsa-055 | level: 1 | type: true-false | answer: true | tags: async-await -->

> [!source] excerpt
> « Lorsqu'une fonction asynchrone est mise en pause, la fonction appelante continue son exécution (car elle a reçu la promesse implicite renvoyée par la fonction `async`). »
> — [MDN — async function](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/async_function)

## `telecharger()` retourne une promesse qui sera rompue plus tard. Que donne `charger()` ?
<!-- id: tsa-056 | level: 3 | tags: async-await, erreurs, pieges -->

```ts
async function charger() {
  try {
    return telecharger();
  } catch {
    return "secours";
  }
}
```

- [x] Une promesse rompue, sans passer par le `catch`
- [ ] Une promesse complétée avec `"secours"`
- [ ] Une promesse complétée avec `undefined`
- [ ] Une erreur levée de façon synchrone à l'appel

> [!explanation]
> Sans `await`, la promesse est retournée telle quelle et rompue après la sortie du `try`. Avec `return await telecharger();`, le rejet serait levé dans le `try` et intercepté.

> [!source] excerpt
> « When the `return` statement is in `try...catch`, awaiting the promise allows the promise's rejection to be caught instead of leaving the error to the caller. »
> — [typescript-eslint — return-await](https://typescript-eslint.io/rules/return-await)

## Dans une fonction `async`, `return await promesse` est au moins aussi rapide que `return promesse`.
<!-- id: tsa-057 | level: 2 | type: true-false | answer: true | tags: async-await, performance -->

> [!explanation]
> L'idée reçue inverse est fausse : grâce aux optimisations des moteurs, `return await` n'est pas plus lent, et il améliore les traces de pile.

> [!source] excerpt
> « Contrairement à une idée répandue, `return await promise` est au moins aussi rapide que `return promise`, grâce à l'optimisation de la résolution des promesses natives par la spécification et les moteurs. »
> — [MDN — await](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await)

## Quel avantage `return await tache()` a-t-il sur `return tache()` quand `tache()` échoue de façon asynchrone ?
<!-- id: tsa-058 | level: 2 | tags: async-await, erreurs -->

- [x] La fonction appelante apparaît dans la trace de la pile de l'erreur
- [ ] L'erreur est convertie en valeur `undefined`
- [ ] La promesse retournée est complétée au lieu d'être rompue
- [ ] L'erreur est levée de façon synchrone, donc plus tôt

> [!source] excerpt
> « Pour améliorer la trace de la pile, vous pouvez utiliser `await` pour déballer la promesse afin que l'exception soit levée dans la fonction actuelle. »
> — [MDN — await](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await#améliorer_la_trace_de_la_pile)

## `lire()` lève parfois une erreur de manière synchrone, avant de retourner sa promesse. Que se passe-t-il alors avec ce code ?
<!-- id: tsa-059 | level: 3 | tags: async-await, erreurs, pieges -->

```ts
const donnees = await lire().catch(() => null);
```

- [x] Le `catch()` n'intercepte pas l'erreur : elle est levée à l'endroit de l'appel
- [ ] Le `catch()` intercepte l'erreur et `donnees` vaut `null`
- [ ] `donnees` vaut `undefined`
- [ ] TypeScript refuse ce code

> [!explanation]
> `.catch()` n'est attaché qu'à une promesse retournée. Si `lire()` lève avant de retourner, il n'y a pas de promesse : seul un `try...catch` autour de l'appel protège ce cas.

> [!source] excerpt
> « Cependant, si `fonctionPromesse()` lève une erreur de manière synchrone, le gestionnaire `catch()` ne l'intercepte pas. Dans ce cas, l'instruction `try...catch` est nécessaire. »
> — [MDN — await](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await)

## En TypeScript, un fichier utilise `await` au niveau supérieur mais ne contient ni `import` ni `export`. Pourquoi est-ce un problème ?
<!-- id: tsa-060 | level: 2 | tags: async-await, compilation -->

- [x] Le fichier n'est pas considéré comme un module, or ce `await` n'est permis que dans un module
- [ ] `await` de niveau supérieur n'est jamais permis en TypeScript
- [ ] Le fichier doit avoir l'extension `.mts`
- [ ] Il faut déclarer `async` en tête du fichier

> [!explanation]
> Ajouter `export {};` suffit à faire du fichier un module.

> [!source] excerpt
> « Note there's a subtlety: top-level `await` only works at the top level of a module, and files are only considered modules when TypeScript finds an `import` or an `export`. »
> — [Notes de version TypeScript 3.8](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html)

## Un module A importe un module B qui utilise `await` au niveau supérieur. Que fait A ?
<!-- id: tsa-061 | level: 2 | tags: async-await -->

- [x] Il attend la fin de l'exécution de B avant de s'exécuter
- [ ] Il s'exécute sans attendre et reçoit des exports `undefined`
- [ ] Il lève une erreur de syntaxe
- [ ] Il bloque le chargement de tous les autres modules de l'application

> [!source] excerpt
> « Ainsi, les modules qui possèdent des modules enfants utilisant `await` attendent l'exécution de ces modules enfants avant de s'exécuter eux-mêmes, sans bloquer le chargement des autres modules enfants. »
> — [MDN — await](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/await)

## `p` est une promesse native et `async function f() { return p; }`. L'expression `f() === p` vaut `true`.
<!-- id: tsa-062 | level: 3 | type: true-false | answer: false | tags: async-await -->

> [!explanation]
> Une fonction `async` crée toujours sa propre promesse, contrairement à `Promise.resolve(p)` qui retourne `p` elle-même.

> [!source] excerpt
> « An async function will return a different reference, whereas `Promise.resolve` returns the same reference if the given value is a promise. »
> — [MDN — async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

## Quel est l'intérêt d'utiliser `async`/`await` plutôt qu'une chaîne de `then()` pour gérer les erreurs ?
<!-- id: tsa-063 | level: 1 | tags: async-await, erreurs -->

- [x] On peut utiliser des blocs `try`/`catch` ordinaires autour du code asynchrone
- [ ] Les erreurs asynchrones sont automatiquement ignorées
- [ ] Les promesses rompues ne peuvent plus se produire
- [ ] Les erreurs deviennent synchrones pour l'appelant

> [!source] excerpt
> « Use of `async` and `await` enables the use of ordinary `try` / `catch` blocks around asynchronous code. »
> — [MDN — async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

## Comment sont traités les gestionnaires de promesses, comparés aux callbacks de `setTimeout()` ?
<!-- id: tsa-064 | level: 1 | tags: boucle-evenements -->

- [x] Les gestionnaires de promesses sont des micro-tâches, les callbacks de `setTimeout()` des tâches
- [ ] Gestionnaires et callbacks sont tous des tâches, traitées dans l'ordre
- [ ] Gestionnaires et callbacks sont tous des micro-tâches, prioritaires
- [ ] Les callbacks de `setTimeout()` sont des micro-tâches, les gestionnaires de promesses des tâches

> [!source] excerpt
> « Promise callbacks are handled as a microtask whereas setTimeout() callbacks are handled as task queues. »
> — [MDN — Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)

## Dans quel ordre ce code affiche-t-il ses lettres ?
<!-- id: tsa-065 | level: 2 | tags: boucle-evenements -->

```ts
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
```

- [x] A, D, C, B
- [ ] A, B, C, D
- [ ] A, D, B, C
- [ ] A, C, D, B

> [!explanation]
> Le code synchrone (A, D) s'exécute d'abord. Puis toutes les micro-tâches (C) sont exécutées avant la tâche suivante, le minuteur (B).

> [!source] excerpt
> « The oldest runnable task in the task queue will be executed during a single iteration of the event loop. After that, microtasks will be executed until the microtask queue is empty »
> — [MDN — Using microtasks in JavaScript with queueMicrotask()](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)

## Qu'affiche ce code ?
<!-- id: tsa-066 | level: 3 | tags: boucle-evenements -->

```ts
setTimeout(() => console.log("minuteur"), 0);
queueMicrotask(() => {
  console.log("micro 1");
  queueMicrotask(() => console.log("micro 2"));
});
```

- [x] micro 1, micro 2, minuteur
- [ ] micro 1, minuteur, micro 2
- [ ] minuteur, micro 1, micro 2
- [ ] micro 1, puis minuteur ; micro 2 n'est jamais exécutée

> [!explanation]
> Une micro-tâche ajoutée par une micro-tâche s'exécute avant la tâche suivante : la boucle vide entièrement la file des micro-tâches.

> [!source] excerpt
> « If a microtask adds more microtasks to the queue by calling queueMicrotask(), those newly-added microtasks execute before the next task is run. »
> — [MDN — Using microtasks in JavaScript with queueMicrotask()](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)

## Quel est le risque d'une micro-tâche qui se replanifie elle-même en boucle avec `queueMicrotask()` ?
<!-- id: tsa-067 | level: 3 | tags: boucle-evenements, pieges -->

- [x] La boucle d'évènements traite des micro-tâches sans fin et ne passe plus aux tâches suivantes
- [ ] Le navigateur la convertit automatiquement en tâche après quelques tours
- [ ] Une erreur de dépassement de pile est levée au premier tour
- [ ] Aucun : les micro-tâches sont exécutées dans un thread séparé

> [!source] excerpt
> « Since microtasks can themselves enqueue more microtasks, and the event loop continues processing microtasks until the queue is empty, there's a real risk of getting the event loop endlessly processing microtasks. »
> — [MDN — Using microtasks in JavaScript with queueMicrotask()](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)

## Pendant qu'une fonction JavaScript s'exécute, un autre code du même agent peut l'interrompre au milieu pour s'exécuter.
<!-- id: tsa-068 | level: 1 | type: true-false | answer: false | tags: boucle-evenements -->

> [!explanation]
> C'est le modèle « run-to-completion » : chaque tâche s'exécute entièrement avant la suivante.

> [!source] excerpt
> « lorsqu'une fonction s'exécute, elle ne peut pas être interrompue et s'exécutera entièrement avant tout autre code »
> — [MDN — Modèle d'exécution JavaScript](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Execution_model)

## Comment JavaScript permet-il la programmation asynchrone au sein d'un même agent ?
<!-- id: tsa-069 | level: 1 | tags: boucle-evenements -->

- [x] Avec une file de tâches traitée par une boucle d'évènements, sur un seul thread
- [ ] En créant un thread système pour chaque promesse
- [ ] En interrompant le code en cours pour exécuter les callbacks prêts
- [ ] En bloquant le programme à chaque opération d'entrée/sortie

> [!source] excerpt
> « appelée boucle d'événement en HTML (et couramment), elle permet la programmation asynchrone en JavaScript tout en restant monothread. »
> — [MDN — Modèle d'exécution JavaScript](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Execution_model)

## Une boucle synchrone très longue dans un gestionnaire de clic n'empêche pas la page de réagir aux autres clics, puisque JavaScript est asynchrone.
<!-- id: tsa-070 | level: 2 | type: true-false | answer: false | tags: boucle-evenements, performance -->

> [!explanation]
> Tant que la tâche en cours n'est pas finie, aucune autre ne s'exécute. Il faut découper un long traitement en plusieurs tâches.

> [!source] excerpt
> « Un inconvénient de ce modèle est que si une tâche prend trop de temps à s'exécuter, l'application web ne peut plus traiter les interactions utilisateur comme les clics ou le défilement. »
> — [MDN — Modèle d'exécution JavaScript](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Execution_model)

## Quand s'exécute la fonction passée à `setTimeout(f, 0)` ?
<!-- id: tsa-071 | level: 1 | tags: boucle-evenements -->

- [x] Plus tard, lors d'un prochain cycle de la boucle d'évènements
- [ ] Immédiatement, avant l'instruction suivante
- [ ] Juste après le code synchrone, avant les gestionnaires de promesses
- [ ] Jamais : un délai de 0 désactive le minuteur

> [!source] excerpt
> « En effet, même si `setTimeout()` a été appelé avec un délai à zéro, la fonction correspondante est placée dans une queue et son exécution est planifiée pour le prochain cycle disponible et pas immédiatement. »
> — [MDN — setTimeout()](https://developer.mozilla.org/fr/docs/Web/API/Window/setTimeout)

## Des appels `setTimeout(f, 0)` sont imbriqués les uns dans les autres. Que font les navigateurs à partir d'un certain niveau d'imbrication ?
<!-- id: tsa-072 | level: 2 | tags: boucle-evenements -->

- [x] Ils imposent un délai minimum de 4 millisecondes
- [ ] Ils exécutent les callbacks comme des micro-tâches
- [ ] Ils arrêtent d'exécuter les minuteurs imbriqués
- [ ] Ils imposent un délai minimum d'une seconde

> [!source] excerpt
> « les navigateurs appliqueront un délai minimum de 4 millisecondes lorsqu'un appel imbriqué à `setTimeout` a été planifié 5 fois. »
> — [MDN — setTimeout()](https://developer.mozilla.org/fr/docs/Web/API/Window/setTimeout)

## Que se passe-t-il avec `setTimeout(f, 3_000_000_000)` (environ 35 jours) dans les navigateurs ?
<!-- id: tsa-073 | level: 3 | tags: boucle-evenements, pieges -->

- [x] Le délai déborde et `f` est exécutée presque immédiatement
- [ ] `f` est exécutée après environ 35 jours
- [ ] Une `RangeError` est levée
- [ ] Le délai est ramené à 24,8 jours

> [!explanation]
> Le délai est stocké sur un entier signé de 32 bits : au-delà de 2 147 483 647 ms, il déborde.

> [!source] excerpt
> « il y a un dépassement des limites lorsqu'on indique un délai supérieur à 2 147 483 647 ms (ce qui correspond à 24,8 jours), et le résultat est un minuteur qui est exécuté immédiatement. »
> — [MDN — setTimeout()](https://developer.mozilla.org/fr/docs/Web/API/Window/setTimeout)

## Quelle fonction permet de planifier explicitement une micro-tâche ?
<!-- id: tsa-074 | level: 1 | tags: boucle-evenements -->

- [x] `queueMicrotask()`
- [ ] `setTimeout(fn, 0)`
- [ ] `requestAnimationFrame()`
- [ ] `setInterval(fn, 0)`

> [!source] excerpt
> « La méthode queueMicrotask() de l'interface Window met en file d'attente une micro-tâche qui doit être exécutée à un moment sûr avant que le contrôle soit retourné à la boucle d'évènements du navigateur. »
> — [MDN — queueMicrotask()](https://developer.mozilla.org/fr/docs/Web/API/Window/queueMicrotask)

## Comment annoter le type de retour d'une fonction `async` qui retourne un nombre ?
<!-- id: tsa-075 | level: 1 | tags: typage -->

- [x] `async function f(): Promise<number>`
- [ ] `async function f(): number`
- [ ] `async function f(): Async<number>`
- [ ] `async function f(): Awaited<number>`

> [!source] excerpt
> « If you want to annotate the return type of a function which returns a promise, you should use the `Promise` type: »
> — [Handbook TypeScript — Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

## Quel type TypeScript donne `Awaited<Promise<Promise<number>>>` ?
<!-- id: tsa-076 | level: 1 | tags: typage -->

- [x] `number`
- [ ] `Promise<number>`
- [ ] `Promise<Promise<number>>`
- [ ] `never`

> [!explanation]
> `Awaited` déballe les promesses récursivement, comme `await`.

> [!source] code
> [Notes de version TypeScript 4.5 — The `Awaited` Type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#the-awaited-type-and-promise-improvements)
> ```ts
> // B = number
> type B = Awaited<Promise<Promise<number>>>;
> ```

## Quel type TypeScript donne `Awaited<boolean | Promise<number>>` ?
<!-- id: tsa-077 | level: 2 | tags: typage -->

- [x] `boolean | number`
- [ ] `boolean | Promise<number>`
- [ ] `number`
- [ ] `never`

> [!explanation]
> `Awaited` s'applique à chaque membre de l'union : `boolean` reste tel quel, `Promise<number>` devient `number`.

> [!source] code
> [Notes de version TypeScript 4.5 — The `Awaited` Type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#the-awaited-type-and-promise-improvements)
> ```ts
> // C = boolean | number
> type C = Awaited<boolean | Promise<number>>;
> ```

## Dans quelle version de TypeScript le type utilitaire `Awaited` est-il apparu ?
<!-- id: tsa-078 | level: 1 | tags: typage -->

- [x] TypeScript 4.5
- [ ] TypeScript 2.1
- [ ] TypeScript 3.8
- [ ] TypeScript 5.2

> [!source] excerpt
> « TypeScript 4.5 introduces a new utility type called the `Awaited` type. »
> — [Notes de version TypeScript 4.5](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#the-awaited-type-and-promise-improvements)

## `async function lireNom() { return "Ada"; }` : comment obtenir le type `string` à partir de `typeof lireNom` ?
<!-- id: tsa-079 | level: 3 | tags: typage -->

- [x] `Awaited<ReturnType<typeof lireNom>>`
- [ ] `ReturnType<typeof lireNom>`
- [ ] `Parameters<typeof lireNom>[0]`
- [ ] `InstanceType<typeof lireNom>`

> [!explanation]
> `ReturnType` donne `Promise<string>` pour une fonction `async` ; `Awaited` retire ensuite la promesse.

> [!source] code
> [`typescript@5.9.3/lib/lib.es5.d.ts:1570` et `:1650`](https://unpkg.com/typescript@5.9.3/lib/lib.es5.d.ts)
> ```ts
> type Awaited<T> = T extends null | undefined ? T : // special case for `null | undefined` when not in `--strictNullChecks` mode
>     T extends object & { then(onfulfilled: infer F, ...args: infer _): any; } ? // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
> // …
> type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
> ```

## Quel type TypeScript décrit un objet « thenable », qui expose seulement une méthode `then` ?
<!-- id: tsa-080 | level: 2 | tags: typage, promesses -->

- [x] `PromiseLike<T>`
- [ ] `Thenable<T>`
- [ ] `Future<T>`
- [ ] `Deferred<T>`

> [!explanation]
> `PromiseLike` est déclaré dans la bibliothèque standard de TypeScript ; c'est le type accepté par exemple par `resolve` et `Promise.resolve`.

> [!source] code
> [`typescript@5.9.3/lib/lib.es5.d.ts:1537-1544`](https://unpkg.com/typescript@5.9.3/lib/lib.es5.d.ts)
> ```ts
> interface PromiseLike<T> {
>     // …
>     then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2>;
> ```

## Que signifie `<void>` dans `new Promise<void>((resolve) => setTimeout(resolve, ms))` ?
<!-- id: tsa-081 | level: 1 | tags: typage, promesses -->

- [x] La promesse se complète sans valeur utile
- [ ] La promesse ne peut jamais être rompue
- [ ] La fonction exécutrice ne doit rien retourner
- [ ] La promesse ne sera jamais complétée

> [!source] code
> [Notes de version TypeScript 2.1 — Downlevel Async Functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html)
> ```ts
> function delay(milliseconds: number) {
>   return new Promise<void>(resolve => {
>     setTimeout(resolve, milliseconds);
>   });
> }
> ```

## Avec l'option `useUnknownInCatchVariables`, quel est le type par défaut de `err` dans `catch (err)` ?
<!-- id: tsa-082 | level: 2 | tags: typage, erreurs -->

- [x] `unknown`
- [ ] `any`
- [ ] `Error`
- [ ] `never`

> [!explanation]
> N'importe quelle valeur peut être levée avec `throw`. `unknown` oblige à vérifier le type avant de l'utiliser.

> [!source] excerpt
> « This flag changes the default type of `catch` clause variables from `any` to `unknown`. »
> — [Notes de version TypeScript 4.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html)

## `err` est de type `unknown` dans un bloc `catch`. Comment accéder à `err.message` sans erreur de typage ?
<!-- id: tsa-083 | level: 2 | tags: typage, erreurs -->

- [x] En vérifiant d'abord `err instanceof Error`
- [ ] En vérifiant d'abord `typeof err === "error"`
- [ ] En écrivant `catch (err: Error)`
- [ ] Directement : `message` existe sur tout objet levé

> [!explanation]
> `instanceof Error` affine le type de `unknown` vers `Error`. `typeof` ne renvoie jamais `"error"`, et TypeScript n'accepte que `any` ou `unknown` comme annotation de `catch`.

> [!source] code
> [Notes de version TypeScript 4.4 — `useUnknownInCatchVariables`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html)
> ```ts
> } catch (err) {
>   // err: unknown
>   // Error! Property 'message' does not exist on type 'unknown'.
>   console.error(err.message);
>   // Works! We can narrow 'err' from 'unknown' to 'Error'.
>   if (err instanceof Error) {
> ```

## Quel est le type du paramètre `raison` dans `promesse.catch((raison) => …)` ?
<!-- id: tsa-084 | level: 3 | tags: typage, erreurs -->

- [x] `any`, même avec l'option `useUnknownInCatchVariables`
- [ ] `unknown` quand `useUnknownInCatchVariables` est activée
- [ ] `Error`
- [ ] Le type de valeur de la promesse

> [!explanation]
> L'option ne concerne que les blocs `try...catch`. Pour `.catch()`, on peut annoter explicitement `(raison: unknown)`.

> [!source] excerpt
> « The Promise analog of the `try-catch` block, `Promise.prototype.catch()`, is not affected by the `useUnknownInCatchVariables` compiler option, and its "`catch` variable" will always have the type `any`. »
> — [typescript-eslint — use-unknown-in-catch-callback-variable](https://typescript-eslint.io/rules/use-unknown-in-catch-callback-variable)

## `afficher(user: User)` est appelée avec `afficher(lireUtilisateur())`, où `lireUtilisateur()` retourne `Promise<User>`. Que fait TypeScript ?
<!-- id: tsa-085 | level: 2 | tags: typage, pieges -->

- [x] Il signale une erreur de type et demande si un `await` a été oublié
- [ ] Il accepte le code, car `Promise<User>` contient un `User`
- [ ] Il insère automatiquement un `await`
- [ ] Il accepte le code mais émet un avertissement à l'exécution

> [!source] code
> [Notes de version TypeScript 3.6 — Improved UX Around Promises](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-6.html)
> ```ts
> async function f() {
>   displayUser(getUserData());
>   //              ~~~~~~~~~~~~~
>   // Argument of type 'Promise<User>' is not assignable to parameter of type 'User'.
>   //   ...
>   // Did you forget to use 'await'?
> }
> ```

## `estAdmin()` est une fonction `async` qui retourne `Promise<boolean>`. Pourquoi TypeScript signale-t-il `if (estAdmin()) { … }` ?
<!-- id: tsa-086 | level: 2 | tags: typage, pieges -->

- [x] Une promesse est toujours vraie dans un `if` : il manque sans doute un `await`
- [ ] Un `if` ne peut pas contenir d'appel de fonction
- [ ] `Promise<boolean>` n'est pas comparable à `true`
- [ ] Les fonctions `async` ne peuvent pas retourner de booléen

> [!explanation]
> L'objet promesse est « truthy » quel que soit le booléen qu'il contiendra : la condition serait toujours vraie.

> [!source] excerpt
> « In prior versions, TypeScript introduced "Always Truthy Promise checks" to catch code where an `await` may have been forgotten »
> — [Notes de version TypeScript 4.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html)

## Qu'affiche ce code, si chaque appel à `sauver()` prend du temps ?
<!-- id: tsa-087 | level: 3 | tags: typage, pieges -->

```ts
[1, 2, 3].forEach(async (n) => {
  await sauver(n);
});
console.log("fini");
```

- [x] « fini » s'affiche avant la fin des sauvegardes
- [ ] « fini » s'affiche après les trois sauvegardes, faites l'une après l'autre
- [ ] « fini » s'affiche après les trois sauvegardes, faites en parallèle
- [ ] TypeScript refuse un callback `async` dans `forEach`

> [!explanation]
> `forEach` attend un callback qui retourne `void` et ignore les promesses retournées : rien n'attend les sauvegardes, et leurs erreurs ne sont pas gérées. Utilisez `for...of` avec `await`, ou `await Promise.all(tableau.map(...))`.

> [!source] excerpt
> « Contextual typing with a return type of `void` does not force functions to not return something. »
> — [Handbook TypeScript — More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)

> [!source] excerpt
> « if you don't mind that passing a `() => Promise<void>` to a `() => void` parameter or JSX attribute can lead to a floating unhandled Promise »
> — [typescript-eslint — no-misused-promises](https://typescript-eslint.io/rules/no-misused-promises)

## Dans quel contexte la boucle `for await...of` peut-elle être utilisée ?
<!-- id: tsa-088 | level: 1 | tags: iteration -->

- [x] Là où `await` est permis : fonction `async` ou niveau supérieur d'un module
- [ ] Partout, y compris dans une fonction classique
- [ ] Uniquement dans une fonction génératrice
- [ ] Uniquement dans un worker

> [!source] excerpt
> « This statement can only be used in contexts where `await` can be used »
> — [MDN — for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)

## À quoi sert le symbole `Symbol.asyncIterator` ?
<!-- id: tsa-089 | level: 1 | tags: iteration -->

- [x] À définir l'itérateur asynchrone par défaut d'un objet
- [ ] À annuler une itération asynchrone en cours
- [ ] À convertir un tableau de promesses en une seule promesse
- [ ] À marquer une fonction comme asynchrone

> [!source] excerpt
> « Le symbole connu Symbol.asyncIterator définit l'itérateur asynchrone par défaut d'un objet. Si cette propriété est définie sur un objet, celui-ci est un itérable asynchrone et peut être utilisé avec une boucle `for await...of`. »
> — [MDN — Symbol.asyncIterator](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator)

## Que retourne la méthode `next()` d'un itérateur asynchrone (`AsyncIterator`) ?
<!-- id: tsa-090 | level: 2 | tags: iteration, typage -->

- [x] Une promesse du résultat d'itération (`Promise<IteratorResult<T>>`)
- [ ] Directement un résultat d'itération `{ value, done }`
- [ ] Une promesse de la valeur suivante, sans indicateur `done`
- [ ] Un tableau de promesses

> [!source] excerpt
> « The difference lies in the fact that the `next`, `return`, and `throw` methods of an `AsyncIterator` return a `Promise` for the iteration result, rather than the result itself. »
> — [Notes de version TypeScript 2.3](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html)

## La boucle `for await...of` fonctionne aussi sur des itérables synchrones, comme un tableau de promesses.
<!-- id: tsa-091 | level: 2 | type: true-false | answer: true | tags: iteration -->

> [!explanation]
> Elle attend alors chaque valeur produite. La règle typescript-eslint `await-thenable` déconseille toutefois cet usage.

> [!source] excerpt
> « `for await...of` works on both sync and async iterables, while `for...of` only works on sync iterables. »
> — [MDN — for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)

## Une boucle `for await...of` est interrompue par un `break`. Que se passe-t-il pour l'itérateur ?
<!-- id: tsa-092 | level: 2 | tags: iteration -->

- [x] Sa méthode `return()` est appelée pour le nettoyage, et sa promesse est attendue
- [ ] Rien : l'itérateur continue de produire des valeurs en arrière-plan
- [ ] Sa méthode `throw()` est appelée avec une erreur d'interruption
- [ ] Une erreur est levée, car `break` est interdit dans `for await...of`

> [!source] excerpt
> « If the `for await...of` loop exited early (e.g., a `break` statement is encountered or an error is thrown), the `return()` method of the iterator is called to perform any cleanup. The returned promise is awaited before the loop exits. »
> — [MDN — for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)

## Quelle est la syntaxe d'une fonction génératrice asynchrone ?
<!-- id: tsa-093 | level: 1 | tags: iteration -->

- [x] `async function* g() { … }`
- [ ] `function async* g() { … }`
- [ ] `async* function g() { … }`
- [ ] `function* async g() { … }`

> [!source] code
> [Notes de version TypeScript 2.3 — Async Generators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html)
> ```ts
> async function* g() {
>   yield 1;
>   await sleep(100);
>   yield* [2, 3];
> }
> ```

## Une fonction fléchée peut être une fonction génératrice asynchrone.
<!-- id: tsa-094 | level: 2 | type: true-false | answer: false | tags: iteration -->

> [!explanation]
> Une fonction fléchée peut être `async`, mais pas génératrice : il faut une déclaration, une expression de fonction ou une méthode.

> [!source] excerpt
> « Arrow functions cannot be Async Generators. »
> — [Notes de version TypeScript 2.3](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html)

## Que retournent les méthodes (`next()`, `return()`, `throw()`) d'un générateur asynchrone ?
<!-- id: tsa-095 | level: 2 | tags: iteration -->

- [x] Toujours des promesses
- [ ] Des résultats `{ value, done }` directement
- [ ] Des promesses pour `next()` seulement
- [ ] Des itérateurs synchrones

> [!source] excerpt
> « Les méthodes des générateurs asynchrones renvoient toujours des objets Promise. »
> — [MDN — AsyncGenerator](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator)

## Quel type TypeScript correspond à l'objet retourné par `async function* nombres() { yield 1; }` ?
<!-- id: tsa-096 | level: 2 | tags: iteration, typage -->

- [x] `AsyncGenerator<number>`
- [ ] `Promise<number[]>`
- [ ] `Generator<Promise<number>>`
- [ ] `Iterable<number>`

> [!source] code
> [`typescript@5.9.3/lib/lib.es2018.asyncgenerator.d.ts:21`](https://unpkg.com/typescript@5.9.3/lib/lib.es2018.asyncgenerator.d.ts)
> ```ts
> interface AsyncGenerator<T = unknown, TReturn = any, TNext = any> extends AsyncIteratorObject<T, TReturn, TNext> {
> ```

## Que faut-il à l'exécution pour que les itérateurs asynchrones compilés par TypeScript fonctionnent ?
<!-- id: tsa-097 | level: 3 | tags: iteration, compilation -->

- [x] `Symbol.asyncIterator`, natif ou fourni par une prothèse (*polyfill*)
- [ ] Rien : TypeScript génère tout le code nécessaire
- [ ] L'option `"strict": true`
- [ ] Un environnement Node.js uniquement

> [!source] excerpt
> « Keep in mind that our support for async iterators relies on support for `Symbol.asyncIterator` to exist at runtime. »
> — [Notes de version TypeScript 2.3](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html)

## À quoi sert la méthode `abort()` d'un `AbortController` ?
<!-- id: tsa-098 | level: 1 | tags: annulation -->

- [x] À interrompre une opération asynchrone en cours
- [ ] À rompre n'importe quelle promesse existante
- [ ] À mettre une opération en pause pour la reprendre
- [ ] À relancer automatiquement une requête échouée

> [!source] excerpt
> « Aborts an asynchronous operation before it has completed. This is able to abort fetch requests, consumption of any response bodies, and streams. »
> — [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

## Comment une opération comme `fetch()` apprend-elle qu'un `AbortController` demande l'annulation ?
<!-- id: tsa-099 | level: 1 | tags: annulation -->

- [x] On lui passe l'`AbortSignal` de `controleur.signal`
- [ ] On lui passe le contrôleur lui-même
- [ ] Le contrôleur rompt toutes les promesses de la page
- [ ] On appelle `fetch.cancel()` avec le contrôleur

> [!source] excerpt
> « Returns an AbortSignal object instance, which can be used to communicate with, or to abort, an asynchronous operation. »
> — [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

## Avec quelle erreur un signal créé par `AbortSignal.timeout(5000)` annule-t-il l'opération ?
<!-- id: tsa-100 | level: 2 | tags: annulation, erreurs -->

- [x] Une `DOMException` nommée `TimeoutError`
- [ ] Une `DOMException` nommée `AbortError`
- [ ] Une `RangeError`
- [ ] Une `AggregateError`

> [!source] excerpt
> « The signal aborts with a `TimeoutError` DOMException on timeout. »
> — [MDN — AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)

## Une requête doit s'arrêter après 5 secondes ou quand l'utilisateur clique sur « Annuler ». Comment combiner les deux signaux ?
<!-- id: tsa-101 | level: 3 | tags: annulation -->

- [x] `AbortSignal.any([AbortSignal.timeout(5000), controleur.signal])`
- [ ] `Promise.race([AbortSignal.timeout(5000), controleur.signal])`
- [ ] `Promise.any([AbortSignal.timeout(5000), controleur.signal])`
- [ ] `[AbortSignal.timeout(5000), controleur.signal]`, passé tel quel à `signal`

> [!explanation]
> Un `AbortSignal` n'est pas une promesse. `AbortSignal.any()` crée un signal annulé dès que l'un des signaux d'entrée l'est.

> [!source] excerpt
> « The returned abort signal is aborted when any of the input iterable abort signals are aborted. »
> — [MDN — AbortSignal.any()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)

## Le serveur répond `404 Not Found` à un appel `fetch()`. Que devient la promesse retournée ?
<!-- id: tsa-102 | level: 2 | tags: annulation, erreurs, pieges -->

- [x] Elle est complétée ; c'est à vous de tester `response.ok`
- [ ] Elle est rompue avec une erreur HTTP 404
- [ ] Elle reste en attente d'une nouvelle tentative
- [ ] Elle est rompue avec une `AbortError` du navigateur

> [!source] excerpt
> « A `fetch()` promise does not reject if the server responds with HTTP status codes that indicate errors (`404`, `504`, etc.). »
> — [MDN — fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch)

## Quelle méthode une déclaration `await using` appelle-t-elle à la fin de sa portée ?
<!-- id: tsa-103 | level: 1 | tags: ressources -->

- [x] `[Symbol.asyncDispose]()`
- [ ] `close()`
- [ ] `finally()`
- [ ] `[Symbol.asyncIterator]().return()`

> [!explanation]
> `await using` accepte aussi un objet qui n'a qu'une méthode `[Symbol.dispose]()`.

> [!source] excerpt
> « They use a different method named by `Symbol.asyncDispose`, though they can operate on anything with a `Symbol.dispose` as well. »
> — [Notes de version TypeScript 5.2](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)

## Plusieurs ressources sont déclarées avec `await using` dans la même portée. Dans quel ordre sont-elles libérées ?
<!-- id: tsa-104 | level: 2 | tags: ressources -->

- [x] Dans l'ordre inverse de leur déclaration
- [ ] Dans l'ordre de leur déclaration
- [ ] Toutes en même temps, en parallèle, sans ordre
- [ ] Dans un ordre non spécifié

> [!source] excerpt
> « They also dispose in a first-in-last-out order like a stack. »
> — [Notes de version TypeScript 5.2](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)

## Quel type global TypeScript décrit un objet doté d'une méthode de libération asynchrone ?
<!-- id: tsa-105 | level: 2 | tags: ressources, typage -->

- [x] `AsyncDisposable`
- [ ] `AsyncIterable`
- [ ] `PromiseLike`
- [ ] `AsyncCloseable`

> [!source] excerpt
> « For convenience, TypeScript also introduces a global type called `AsyncDisposable` that describes any object with an asynchronous dispose method. »
> — [Notes de version TypeScript 5.2](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)

## Qu'est-ce qu'une promesse « flottante » (*floating promise*) ?
<!-- id: tsa-106 | level: 1 | tags: pieges -->

- [x] Une promesse créée sans aucun code pour gérer ses éventuelles erreurs
- [ ] Une promesse qui n'est jamais acquittée
- [ ] Une promesse partagée entre plusieurs modules
- [ ] Une promesse dont la valeur est un nombre à virgule flottante

> [!source] excerpt
> « A "floating" Promise is one that is created without any code set up to handle any errors it might throw. »
> — [typescript-eslint — no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises)

## Quelles façons de traiter une promesse satisfont la règle `@typescript-eslint/no-floating-promises` ?
<!-- id: tsa-107 | level: 2 | tags: pieges -->

Sélectionnez toutes les bonnes réponses.

- [x] L'attendre avec `await`
- [x] Appeler `.catch()` avec un gestionnaire
- [x] La marquer explicitement avec `void`
- [ ] Appeler `.then()` avec un seul gestionnaire de succès

> [!explanation]
> Un `.then(succes)` seul laisse les rejets sans gestionnaire. La règle accepte aussi `.then()` avec deux arguments et le fait de retourner la promesse.

> [!source] excerpt
> « This rule will report Promise-valued statements that are not treated in one of the following ways: »
> — [typescript-eslint — no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises)

> [!source] link
> [typescript-eslint — no-floating-promises (liste complète des traitements acceptés)](https://typescript-eslint.io/rules/no-floating-promises)

## Que détecte la règle `@typescript-eslint/no-misused-promises` ?
<!-- id: tsa-108 | level: 2 | tags: pieges -->

- [x] Des promesses passées à des emplacements logiques, comme une condition `if`, où elles sont mal gérées
- [ ] Des promesses créées sans être utilisées ni attendues
- [ ] Des `await` appliqués à des valeurs qui ne sont pas des promesses
- [ ] Des fonctions `async` qui ne contiennent aucun `await`

> [!explanation]
> Les promesses non traitées sont le domaine de `no-floating-promises`, les `await` inutiles celui de `await-thenable`.

> [!source] excerpt
> « This rule forbids providing Promises to logical locations such as if statements in places where the TypeScript compiler allows them but they are not handled properly. »
> — [typescript-eslint — no-misused-promises](https://typescript-eslint.io/rules/no-misused-promises)

## Que signale la règle `@typescript-eslint/await-thenable` ?
<!-- id: tsa-109 | level: 2 | tags: pieges -->

- [x] Un `await` appliqué à une valeur qui n'est pas un *thenable*
- [ ] Un *thenable* utilisé sans `await`
- [ ] Une fonction `async` qui ne contient aucun `await`
- [ ] Un `await` placé dans une boucle

> [!explanation]
> C'est souvent le signe d'une erreur, par exemple des parenthèses oubliées : `await charger` au lieu de `await charger()`.

> [!source] excerpt
> « While doing so is valid JavaScript, it is often a programmer error, such as forgetting to add parenthesis to call a function that returns a Promise. »
> — [typescript-eslint — await-thenable](https://typescript-eslint.io/rules/await-thenable)

## Pourquoi la règle `promise-function-async` impose-t-elle `async` aux fonctions qui retournent une promesse ?
<!-- id: tsa-110 | level: 3 | tags: pieges, erreurs -->

- [x] Pour qu'elles signalent leurs erreurs seulement par une promesse rompue
- [ ] Parce qu'une fonction non `async` ne peut pas retourner de promesse typée
- [ ] Pour que leurs promesses s'exécutent plus vite dans le moteur
- [ ] Pour que l'appelant puisse utiliser `then()` sur leur résultat

> [!explanation]
> Une fonction classique qui retourne une promesse peut aussi lever une exception avant de la retourner ; l'appelant doit alors gérer les deux cas.

> [!source] excerpt
> « In contrast, non-`async`, `Promise`-returning functions are technically capable of either. Code that handles the results of those functions will often need to handle both cases, which can get complex. »
> — [typescript-eslint — promise-function-async](https://typescript-eslint.io/rules/promise-function-async)

## Que demande la règle `@typescript-eslint/prefer-promise-reject-errors` ?
<!-- id: tsa-111 | level: 1 | tags: pieges, erreurs -->

- [x] De ne rompre les promesses qu'avec des objets `Error`
- [ ] De toujours ajouter un `.catch()` aux promesses
- [ ] D'utiliser `Promise.reject()` plutôt que `throw`
- [ ] De préférer `async`/`await` aux appels `then()`

> [!source] excerpt
> « It uses type information to enforce that `Promise`s are only rejected with `Error` objects. »
> — [typescript-eslint — prefer-promise-reject-errors](https://typescript-eslint.io/rules/prefer-promise-reject-errors)

## Quel évènement le navigateur émet-il quand une promesse est rompue sans gestionnaire de rejet ?
<!-- id: tsa-112 | level: 1 | tags: pieges, erreurs -->

- [x] `unhandledrejection`
- [ ] `error`
- [ ] `rejectionhandled`
- [ ] `promiseerror`

> [!source] excerpt
> « The `unhandledrejection` event is sent to the global scope of a script when a JavaScript Promise that has no rejection handler is rejected »
> — [MDN — unhandledrejection](https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event)

## Deux promesses passées à `Promise.all()` sont rompues l'une après l'autre. Le second rejet ne déclenche pas d'évènement `unhandledrejection`.
<!-- id: tsa-113 | level: 3 | type: true-false | answer: true | tags: combinateurs, pieges -->

> [!explanation]
> `Promise.all()` attache un gestionnaire à chaque promesse dès son appel : les rejets suivants sont considérés comme gérés, et simplement ignorés.

> [!source] excerpt
> « Les rejets survenant après le premier rejet sont ignorés et ne déclenchent aucun évènement `unhandledrejection`. »
> — [MDN — Promise.all()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

## Quelle version de TypeScript a permis de compiler `async`/`await` vers ES3 et ES5 ?
<!-- id: tsa-114 | level: 2 | tags: compilation -->

- [x] TypeScript 2.1
- [ ] TypeScript 1.7
- [ ] TypeScript 3.8
- [ ] TypeScript 4.5

> [!explanation]
> TypeScript 1.7 ne prenait en charge `async`/`await` que pour les cibles ES6 (ES2015).

> [!source] excerpt
> « TypeScript 2.1 brings the capability to ES3 and ES5 run-times, meaning you'll be free to take advantage of it no matter what environment you're using. »
> — [Notes de version TypeScript 2.1](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html)

## Du code `async`/`await` est compilé par TypeScript vers ES5. Que faut-il à l'exécution ?
<!-- id: tsa-115 | level: 2 | tags: compilation -->

- [x] Une implémentation globale de `Promise`, native ou fournie par une prothèse
- [ ] Rien : TypeScript intègre sa propre implémentation de `Promise` dans le code généré
- [ ] Un moteur qui prend en charge les générateurs natifs
- [ ] Node.js 4 ou plus récent

> [!source] excerpt
> « Note: first, we need to make sure our run-time has an ECMAScript-compliant `Promise` available globally. »
> — [Notes de version TypeScript 2.1](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html)

## Ajouter `"es2015.promise"` à l'option `lib` du `tsconfig.json` fournit une implémentation de `Promise` aux anciens navigateurs.
<!-- id: tsa-116 | level: 3 | type: true-false | answer: false | tags: compilation -->

> [!explanation]
> `lib` ne choisit que des fichiers de déclarations de types. Si l'environnement n'a pas `Promise`, il faut une prothèse (*polyfill*) à l'exécution.

> [!source] excerpt
> « Specify a set of bundled library declaration files that describe the target runtime environment. »
> — [Référence tsconfig — lib](https://www.typescriptlang.org/tsconfig/#lib)

## Changer l'option `target` du `tsconfig.json` modifie aussi la valeur par défaut de l'option `lib`.
<!-- id: tsa-117 | level: 2 | type: true-false | answer: true | tags: compilation -->

> [!source] excerpt
> « Changing `target` also changes the default value of `lib`. »
> — [Référence tsconfig — target](https://www.typescriptlang.org/tsconfig/#target)
