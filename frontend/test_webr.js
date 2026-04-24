const { WebR } = require('webr');

async function test() {
  const webr = new WebR();
  await webr.init();
  
  const shelter = await new webr.Shelter();
  const code = `plot(1:10)`;
  const finalCode = `svg("test.svg", width=8, height=5)\ntryCatch({${code}}, finally={dev.off()})`;
  
  await shelter.captureR(finalCode, { withAutoprint: true, catchStreams: true });
  
  try {
    const data = await webr.FS.readFile('/home/web_user/test.svg');
    const svgContent = new TextDecoder().decode(data);
    console.log("SVG size:", svgContent.length);
    console.log("SVG snippet:", svgContent.substring(0, 150));
    console.log("Has lines/points?", svgContent.includes('<circle') || svgContent.includes('<path'));
  } catch (e) {
    console.log("Error reading SVG:", e);
  }
  process.exit(0);
}

test();
