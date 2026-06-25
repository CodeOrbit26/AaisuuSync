const line = "A SAMANDAR [00:08.50]PINCODE";
const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/);
console.log(match);
