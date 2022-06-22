async function main() {
  const lists = document.querySelectorAll(".items");
  let current = 0;
  lists[current].classList.add("show");

  setInterval(() => {
    lists.forEach((img) => img.classList.remove("show"));
    current = current < lists.length - 1 ? current + 1 : 0;

    console.log(current);
    lists[current].classList.add("show");
  }, 1000);
}

main();
