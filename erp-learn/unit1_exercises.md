# Unit 1 Exercises: JavaScript Basics

Practice these 10 exercises to master JavaScript variables, functions, objects, and arrays!

---

### Exercise 1: `const` or `let`?
For each scenario below, decide whether you should use `const` or `let`:
a) Storing a user's `accountID` which never changes.
b) Storing `currentTemperature` in a weather widget that updates every 10 seconds.
c) Storing `birthYear` of a student.
d) Storing `activeUsersCount` on a dashboard.

---

### Exercise 2: Declaring Variables
Create three variables in JavaScript:
- A `const` variable named `projectName` set to `"Campus Connect"`.
- A `let` variable named `totalStudents` set to `1500`.
- A `const` variable named `isSystemActive` set to `true`.

---

### Exercise 3: Creating a Function
Write a function named `calculateTotalCost` that takes two parameters (`price` and `quantity`) and returns the total cost (`price * quantity`).

---

### Exercise 4: Arrow Function Conversion
Convert the following regular function into an **arrow function**:

```javascript
function getWelcomeMessage(studentName) {
    return "Hello " + studentName + ", welcome to the ERP portal!";
}
```

---

### Exercise 5: Creating an Object
Create an object variable named `student` with the following properties:
- `id`: `101`
- `name`: `"Alex"`
- `department`: `"Computer Science"`
- `gpa`: `3.8`

---

### Exercise 6: Reading Object Properties
Given this object:
```javascript
const course = {
    code: "CS101",
    title: "Introduction to Programming",
    credits: 4
};
```
Write `console.log()` statements to print out:
1. The course title.
2. The course code.

---

### Exercise 7: Creating an Array
Create an array named `departments` containing 4 strings representing university departments (e.g., `"CS"`, `"ECE"`, `"ME"`, `"CE"`).

---

### Exercise 8: Reading Array Elements
Given the array:
```javascript
const grades = ["A", "B+", "A-", "O"];
```
1. What index position is `"A"` at?
2. Write a code snippet to print the 3rd element (`"A-"`).

---

### Exercise 9: Array of Objects
Create an array named `attendanceList` that contains 2 student objects. Each object should have a `name` property and a `present` (boolean) property.

---

### Exercise 10: Mini Challenge (Bringing It All Together!)
Write a function named `formatStudentCard` that takes a `student` object (with `name` and `department` properties) and returns a formatted string like:
`"Student: Alex | Dept: Computer Science"`

Try calling your function with an object and print the result!
