---
title: "Physics: Classical Mechanics"
description: "Explore Newton's laws of motion, kinematics, and fundamental physics equations with clear mathematical formulations."
order: 3
duration: "60 min"
difficulty: "beginner"
---

# Physics: Classical Mechanics

## Introduction

Classical mechanics describes the motion of macroscopic objects. From falling apples to orbiting planets, the equations of mechanics govern the physical world around us.

---

## Kinematics: Motion in One Dimension

### Position and Displacement

The position of an object is described by $x(t)$, a function of time. Displacement is:

$$\Delta x = x_f - x_i$$

### Velocity

Average velocity:

$$\bar{v} = \frac{\Delta x}{\Delta t}$$

Instantaneous velocity:

$$v = \frac{dx}{dt}$$

### Acceleration

Average acceleration:

$$\bar{a} = \frac{\Delta v}{\Delta t}$$

Instantaneous acceleration:

$$a = \frac{dv}{dt} = \frac{d^2x}{dt^2}$$

---

## Kinematic Equations

For constant acceleration $a$, we have the four kinematic equations:

$$v = v_0 + at$$

$$x = x_0 + v_0 t + \frac{1}{2}at^2$$

$$v^2 = v_0^2 + 2a(x - x_0)$$

$$x = x_0 + \frac{1}{2}(v_0 + v)t$$

where:
- $v_0$ = initial velocity
- $v$ = final velocity
- $a$ = acceleration
- $t$ = time
- $x_0$ = initial position
- $x$ = final position

### Interactive: Projectile Motion

The chart below shows position vs. time for an object dropped from rest (no air resistance, $g = 9.8 \, \text{m/s}^2$):

```plot
{
  "type": "line",
  "title": "Free Fall: Position vs Time",
  "xLabel": "Time (s)",
  "yLabel": "Distance (m)",
  "xKey": "t",
  "data": [
    {"t": 0, "d": 0},
    {"t": 0.5, "d": 1.225},
    {"t": 1, "d": 4.9},
    {"t": 1.5, "d": 11.025},
    {"t": 2, "d": 19.6},
    {"t": 2.5, "d": 30.625},
    {"t": 3, "d": 44.1},
    {"t": 3.5, "d": 60.025},
    {"t": 4, "d": 78.4}
  ]
}
```

And here is the corresponding velocity vs. time graph ($v = gt$):

```plot
{
  "type": "line",
  "title": "Free Fall: Velocity vs Time",
  "xLabel": "Time (s)",
  "yLabel": "Velocity (m/s)",
  "xKey": "t",
  "colors": ["#ef4444"],
  "data": [
    {"t": 0, "v": 0},
    {"t": 0.5, "v": 4.9},
    {"t": 1, "v": 9.8},
    {"t": 1.5, "v": 14.7},
    {"t": 2, "v": 19.6},
    {"t": 2.5, "v": 24.5},
    {"t": 3, "v": 29.4},
    {"t": 3.5, "v": 34.3},
    {"t": 4, "v": 39.2}
  ]
}
```

---

## Newton's Laws of Motion

### First Law (Inertia)

> An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an unbalanced force.

### Second Law (Force and Acceleration)

The net force on an object equals its mass times its acceleration:

$$\sum \vec{F} = m\vec{a}$$

This is the fundamental equation of mechanics. From it, we can derive:

$$\vec{a} = \frac{\sum \vec{F}}{m}$$

$$m = \frac{\sum \vec{F}}{\vec{a}}$$

### Third Law (Action-Reaction)

For every action, there is an equal and opposite reaction:

$$\vec{F}_{12} = -\vec{F}_{21}$$

---

## Types of Forces

### Gravitational Force

Newton's law of universal gravitation:

$$F_g = G\frac{m_1 m_2}{r^2}$$

where $G = 6.674 \times 10^{-11} \, \text{N·m}^2/\text{kg}^2$.

Near Earth's surface:

$$F_g = mg$$

where $g = 9.8 \, \text{m/s}^2$.

### Normal Force

The normal force $F_N$ acts perpendicular to a surface. For an object on a flat surface:

$$F_N = mg$$

### Friction

Static friction:

$$f_s \leq \mu_s F_N$$

Kinetic friction:

$$f_k = \mu_k F_N$$

where $\mu_s$ and $\mu_k$ are the coefficients of static and kinetic friction.

### Spring Force (Hooke's Law)

$$F_s = -kx$$

where $k$ is the spring constant and $x$ is the displacement from equilibrium.

---

## Work and Energy

### Work

Work done by a constant force:

$$W = Fd\cos\theta$$

where $\theta$ is the angle between the force and displacement vectors.

### Kinetic Energy

$$KE = \frac{1}{2}mv^2$$

### Potential Energy

Gravitational potential energy:

$$PE_g = mgh$$

Elastic potential energy:

$$PE_s = \frac{1}{2}kx^2$$

### Work-Energy Theorem

$$W_{net} = \Delta KE = KE_f - KE_i$$

### Conservation of Energy

$$KE_i + PE_i = KE_f + PE_f$$

$$\frac{1}{2}mv_i^2 + mgh_i = \frac{1}{2}mv_f^2 + mgh_f$$

---

## Momentum and Impulse

### Linear Momentum

$$\vec{p} = m\vec{v}$$

### Impulse

$$\vec{J} = \vec{F}\Delta t = \Delta\vec{p}$$

### Conservation of Momentum

For an isolated system:

$$m_1\vec{v}_{1i} + m_2\vec{v}_{2i} = m_1\vec{v}_{1f} + m_2\vec{v}_{2f}$$

---

## Interactive Simulation: Forces and Motion

Experiment with the simulation below to see Newton's laws in action. Apply different forces to objects and observe how they accelerate.

```phet
{
  "slug": "forces-and-motion-basics",
  "title": "Forces and Motion: Basics",
  "language": "en"
}
```

> [!TIP]
> Try applying different forces to the objects. Notice how heavier objects accelerate more slowly for the same force — this is Newton's Second Law in action!

---

## 3D Molecular Viewer

Explore the 3D structure of **Crambin** (PDB: 1CRN), a small plant protein with 46 amino acids. Drag to rotate, scroll to zoom, and right-click to pan.

```molecule
{
  "pdbId": "1CRN",
  "style": "cartoon",
  "color": "spectrum",
  "height": "500px",
  "label": "Crambin (1CRN)"
}
```

> [!NOTE]
> Molecular structures are loaded from the [RCSB Protein Data Bank](https://www.rcsb.org). You can replace `1CRN` with any valid PDB ID (e.g., `4HHB` for hemoglobin, `1IGT` for an antibody).

---

## Practice Questions

```question
{
  "id": "phys-q1",
  "type": "multiple-choice",
  "question": "A car accelerates from rest at 2 m/s² for 5 seconds. What is its final velocity?",
  "options": [
    "5 m/s",
    "7 m/s",
    "10 m/s",
    "15 m/s"
  ],
  "correct": 2,
  "explanation": "Using v = v₀ + at: v = 0 + (2)(5) = 10 m/s"
}
```

```question
{
  "id": "phys-q2",
  "type": "multiple-choice",
  "question": "According to Newton's Second Law, if you double the force on an object, what happens to its acceleration?",
  "options": [
    "It stays the same",
    "It doubles",
    "It halves",
    "It quadruples"
  ],
  "correct": 1,
  "explanation": "Since F = ma, if F doubles and m stays constant, then a must also double: a = F/m"
}
```

```question
{
  "id": "phys-q3",
  "type": "multiple-choice",
  "question": "A 5 kg object is lifted 3 meters. What is its gravitational potential energy? (g = 10 m/s²)",
  "options": [
    "15 J",
    "50 J",
    "150 J",
    "300 J"
  ],
  "correct": 2,
  "explanation": "PE = mgh = 5 × 10 × 3 = 150 J"
}
```

---

## Interactive Exercises

### Drag-and-Drop: Order the Kinematic Steps

Put these steps in the correct order for solving a kinematics problem:

```dragdrop
{
  "question": "Order these steps for solving a kinematics problem:",
  "items": [
    "Identify knowns and unknowns",
    "Choose the correct kinematic equation",
    "Plug in values and solve",
    "Check units and reasonableness"
  ],
  "correctOrder": [
    "Identify knowns and unknowns",
    "Choose the correct kinematic equation",
    "Plug in values and solve",
    "Check units and reasonableness"
  ],
  "explanation": "Always start by listing what you know, then pick the equation that connects your knowns to your unknowns."
}
```

### Matching: Newton's Laws

Match each law of motion with its correct statement:

```matching
{
  "question": "Match each law of motion with its statement:",
  "pairs": [
    {"left": "First Law", "right": "An object at rest stays at rest unless acted upon"},
    {"left": "Second Law", "right": "F = ma"},
    {"left": "Third Law", "right": "For every action there is an equal and opposite reaction"}
  ],
  "explanation": "Newton's three laws form the foundation of classical mechanics."
}
```

### Fill in the Blanks: Energy Conservation

```fillblank
{
  "question": "Complete the conservation of energy equation:",
  "template": "The total {{1}} energy equals the total {{2}} energy: KE_i + PE_i = KE_f + PE_f. Kinetic energy is {{3}}mv² and gravitational potential energy is {{4}}.",
  "answers": {
    "1": "mechanical",
    "2": "final",
    "3": "½",
    "4": "mgh"
  },
  "distractors": ["thermal", "initial", "mv", "gh²"],
  "explanation": "In the absence of non-conservative forces, total mechanical energy is conserved throughout the motion."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Kinematics equations describe motion with constant acceleration: $v = v_0 + at$ and $x = x_0 + v_0 t + \frac{1}{2}at^2$
- Newton's Second Law: $\sum \vec{F} = m\vec{a}$
- Work: $W = Fd\cos\theta$; Kinetic Energy: $KE = \frac{1}{2}mv^2$
- Energy is conserved: $KE_i + PE_i = KE_f + PE_f$
- Momentum is conserved in isolated systems
