const desc = `Microservice Request Scheduling
You are a backend engineer at a B2B SaaS company managing a single-threaded API gateway that processes incoming microservice requests one at a time. Each request has a processing time of exactly 1 unit and a deadline by which it must be completed.

Example
Input:deadlines = [2, 1, 2, 1, 3]Output:3Explanation:Sort by deadline: ...

Input Format
Single line: A list of integers deadlines where deadlines[i] is the deadline of the i-th request.

Output Format
Single integer: The maximum number of requests that can be scheduled without any deadline miss.

Constraints
1 <= len(deadlines) <= 10^4

Real-World Use Cases
1. API Gateway SLA Enforcement in B2B SaaS
`;

let result = desc;
const headingsToEnforce = [
    "Input Format", 
    "Output Format", 
    "Constraints", 
    "Example", 
    "Example 1", 
    "Example 2", 
    "Example 3",
    "Real-World Use Cases"
];
headingsToEnforce.forEach(h => {
    const regex = new RegExp(`(^|\\n)\\s*\\**${h}:?\\**\\s*(?=\\n|$)`, "gim");
    result = result.replace(regex, `\n\n### ${h}\n\n`);
});

console.log(result);
