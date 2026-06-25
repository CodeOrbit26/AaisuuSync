const lyrics1 = "[00:05] hello\n[00:06.12] world";
const regex = /\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/;
lyrics1.split('\n').forEach(line => {
  const match = line.match(regex);
  if (match) {
    console.log("Matched:", parseFloat(match[2]), match[3]);
  } else {
    console.log("Failed:", line);
  }
});
