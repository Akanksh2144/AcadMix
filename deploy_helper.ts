// Helper to read and output file for deploy
const content = await Deno.readTextFile("./insights-query/index.ts");
console.log(JSON.stringify({size: content.length, firstLine: content.split('\n')[0]}));
