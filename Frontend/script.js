let n = 10;
const name =  "Prince";

console.log(`Hello ${name}, your number is ${n}`);

let a = 10;
let b = 20;

let sum = (x, y= 100) =>{ 
    return x + y;
}
console.log(`sum = ${sum(a, b)}`);


let fruits = ["Apple", "Mango", "Banana", "Orange"];
let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
let[fruit1,fruit2] = fruits;

console.log(`Fruit 1: ${fruit1}`);
console.log(`Fruit 2: ${fruit2}`);


let arr = [...fruits, ...days];


let {length} = arr;
console.log(`Length of fruits array: ${length}`);

for(let item of arr){
    console.log(item);
}

const person = new Set();
person.add("Prince");
person.add("Rohit");
person.add("Suhash");

console.log(person);

class Student {
    constructor(name, age){
        this.name = name;
        this.age = age;
    }
}

let student1 = new Student("Prince", 21);
console.log(student1);

function sumAll(...numbers){
    let total = 0;
    for(let num of numbers){
        total += num;
    }
    return total;
}

let sumOfAll = sumAll(10, 20, 30, 40, 50);
console.log(`Sum of all numbers: ${sumOfAll}`);

let alphabet  = Array.from("abcdefghijklmnopqrstuvwxyz");
console.log(alphabet);


