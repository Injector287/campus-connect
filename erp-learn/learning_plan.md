# ERP Project Learning Roadmap

Welcome to your learning journey! Since you "vibecoded" this project using AI, you have a fully functional application, but you might feel like it's a magic black box. 

Our goal in this `erp-learn` directory is to break down that black box piece by piece. 

Here is the exact roadmap we will follow to get you to fully understand the code that is powering your ERP:

## Phase 1: The Fundamentals (JavaScript & React)
Before we can understand the complex stuff, we need to know the language it's written in.
1. **JavaScript Basics:** Variables, functions, objects, and arrays.
2. **Asynchronous JavaScript:** Promises, `async`, and `await` (how your app waits for data).
3. **React Basics:** Components (the building blocks of your UI), JSX (HTML inside JavaScript), and Props.
4. **React State & Hooks:** How your app remembers things (like if a user clicked a button or typed in an input).

## Phase 2: The Framework (Next.js App Router)
Your app is built on Next.js 14+, which uses the modern "App Router" system.
1. **The `src/app` Directory:** How routing works (folders turn into web pages).
2. **Pages vs. Layouts:** How `page.js` and `layout.js` work together.
3. **Server vs. Client Components:** The difference between code running on your computer vs. code running on the user's browser.

## Phase 3: The Database (Prisma ORM)
Your app needs to store data (like user schedules, leave requests, etc.). It uses an ORM (Object-Relational Mapper) called Prisma.
1. **Database Basics:** What is a database and how is it structured?
2. **Prisma Schema:** How the `prisma/schema.prisma` file defines your data.
3. **Reading & Writing Data:** How the app actually saves and retrieves information using Prisma.

## Phase 4: Styling & UI
Your project looks incredible because it uses a custom design system with Glassmorphism.
1. **CSS Variables & Theming:** How your `globals.css` file defines colors and shapes.
2. **Glassmorphism:** How the frosted glass effect is made (backdrop-filter).
3. **Responsive Design:** How your app adapts to mobile vs desktop screens.

## Phase 5: Advanced Features
1. **Data Fetching:** How `SWR` and `axios` are used to load data from external APIs or your own backend.
2. **Data Visualization (Recharts):** How the beautiful graphs and charts are rendered.

---

I will guide you through each of these one by one, right here. Ready to begin?
