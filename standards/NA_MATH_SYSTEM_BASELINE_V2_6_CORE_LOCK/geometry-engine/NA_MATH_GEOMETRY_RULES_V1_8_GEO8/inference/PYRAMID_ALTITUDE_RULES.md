# GEO-5 — Pyramid Altitude Inference Rules

## Global lock

`SH` may be drawn vertical only when:

1. `SH ⟂ BASE_PLANE` is VERIFIED, and
2. `SH` is confirmed as an altitude.

No "looks vertical" reasoning is accepted.

---

## A. Directly given altitude

If the problem directly gives

\[
SH\perp (ABCD),
\]

and \(H\in(ABCD)\), the engine may confirm `SH` as an altitude.

---

## B. Two intersecting base lines

If \(d_1,d_2\subset(P)\), \(d_1\cap d_2=\{H\}\), and

\[
SH\perp d_1,\qquad SH\perp d_2,
\]

then

\[
SH\perp(P).
\]

Only then may `SH` be rendered vertical.

---

## C. Perpendicular side plane

If

\[
(SAB)\perp(ABCD),
\]

with intersection \(AB\), and in triangle \(SAB\)

\[
SH\perp AB,\qquad H\in AB,
\]

then

\[
SH\perp(ABCD).
\]

Do not place \(H\) at the midpoint of \(AB\) unless independently proven.

---

## D. \(SA=SB=SC\)

Let \(H\) be the orthogonal projection of \(S\) onto \((ABC)\).

From

\[
SA=SB=SC
\]

and \(SH\perp(ABC)\), the engine may derive

\[
HA=HB=HC.
\]

Therefore \(H\) is the circumcenter of triangle \(ABC\).

The renderer must construct \(H\) as the circumcenter; it must not use the visual center of the triangle.

---

## E. \(\angle SBA=\angle SCA=90^\circ\)

Let \(H\) be the orthogonal projection of \(S\) onto \((ABC)\).

Since \(SH\perp(ABC)\), the projection of \(SB\) onto the base is \(HB\), and the projection of \(SC\) is \(HC\). From

\[
SB\perp BA,\qquad SC\perp CA
\]

the engine may derive

\[
HB\perp AB,\qquad HC\perp AC.
\]

Hence

\[
\angle HBA=\angle HCA=90^\circ,
\]

so \(H,B,A,C\) are concyclic.

The circle may only be rendered after the `cyclic(H,B,A,C)` claim is VERIFIED.

---

## Negative rule

The following are NOT sufficient by themselves:

- apex appears above the center;
- side edges look equal;
- a face looks perpendicular to the base;
- \(H\) looks like a midpoint;
- two screen segments look perpendicular;
- two screen segments look parallel.

Missing premise => `NO_INFERENCE`.
