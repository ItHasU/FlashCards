---
format: 1
id: tcp-handshake
title: La poignée de main TCP en trois temps
description: Comment une connexion TCP est établie.
language: fr
generated_at: 2026-10-03
generator: exemple écrit à la main
sources:
  - https://www.rfc-editor.org/rfc/rfc9293
---

## Combien de segments sont échangés pendant l'établissement d'une connexion TCP ?
<!-- id: tcp-001 | level: 1 | tags: handshake -->

- [x] 3
- [ ] 2
- [ ] 4
- [ ] 1

> [!explanation]
> On parle de poignée de main *en trois temps* : SYN, SYN-ACK, puis ACK.

> [!source] image
> ![La poignée de main TCP en trois temps](media/three-way-handshake.svg)

> [!source] link
> [RFC 9293, §3.5 — Establishing a Connection (en anglais)](https://www.rfc-editor.org/rfc/rfc9293#section-3.5)

## Quel drapeau le client positionne-t-il dans le premier segment de la poignée de main ?
<!-- id: tcp-002 | level: 1 | tags: handshake, flags -->

- [x] SYN
- [ ] ACK
- [ ] FIN
- [ ] RST

> [!source] image
> ![La poignée de main TCP en trois temps](media/three-way-handshake.svg)

> [!source] link
> [RFC 9293, §3.5 — Establishing a Connection (en anglais)](https://www.rfc-editor.org/rfc/rfc9293#section-3.5)

## Que répond le serveur au SYN d'un client lorsqu'il accepte la connexion ?
<!-- id: tcp-003 | level: 2 | tags: handshake, flags -->

- [x] Un segment avec les drapeaux SYN et ACK positionnés
- [ ] Un segment avec seulement le drapeau ACK
- [ ] Un segment avec seulement le drapeau SYN
- [ ] Rien tant que le client n'a pas envoyé de données

> [!explanation]
> Le serveur acquitte le SYN du client (ACK) et envoie son propre numéro de séquence initial (SYN) dans le même segment.

> [!source] image
> ![La poignée de main TCP en trois temps](media/three-way-handshake.svg)

## UDP ouvre lui aussi une connexion par une poignée de main avant d'envoyer des données.
<!-- id: tcp-004 | level: 1 | type: true-false | answer: false | tags: udp -->

> [!explanation]
> UDP fonctionne sans connexion : chaque datagramme est envoyé indépendamment, sans poignée de main préalable.

> [!source] link
> [User Datagram Protocol — Wikipédia](https://fr.wikipedia.org/wiki/User_Datagram_Protocol)

## Le SYN du client porte le numéro de séquence x. Quel numéro d'acquittement porte le SYN-ACK du serveur ?
<!-- id: tcp-005 | level: 3 | tags: handshake, sequence-numbers -->

- [x] x + 1
- [ ] x
- [ ] 0
- [ ] y + 1, où y est le numéro de séquence du serveur

> [!explanation]
> Le drapeau SYN consomme un numéro de séquence : le serveur acquitte donc x + 1, le prochain octet qu'il attend du client.

> [!source] image
> ![La poignée de main TCP en trois temps](media/three-way-handshake.svg)

> [!source] link
> [RFC 9293, §3.5 — Establishing a Connection (en anglais)](https://www.rfc-editor.org/rfc/rfc9293#section-3.5)

## Quelle RFC est la spécification actuelle de TCP ?
<!-- id: tcp-006 | level: 2 | tags: standards -->

- [x] RFC 9293
- [ ] RFC 793
- [ ] RFC 768
- [ ] RFC 2616

> [!explanation]
> La RFC 9293 (2022) rend obsolète la RFC 793 d'origine (1981). La RFC 768 spécifie UDP et la RFC 2616 une ancienne version de HTTP/1.1.

> [!source] link
> [RFC 9293 — Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293)
