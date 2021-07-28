export default function orderList(target) {
  // get the container element
  target = document.getElementById(target);
  const items = target.getElementsByTagName("li");
  let current = null;
  for (const i of items) {
    // attach draggable attribute to each list item
    i.draggable = true;
    // eslint-disable-next-line no-loop-func
    i.addEventListener("dragstart", function() {
      current = this;
      for (const it of items) {
        if (it !== current) {
          it.classList.add("hint");
        }
      }
    });

    // eslint-disable-next-line no-loop-func
    i.addEventListener("dragenter", function() {
      if (this != current) {
        this.classList.add("active");
      }
    });
    i.addEventListener("dragleave", function() {
      this.classList.remove("active");
    });

    i.addEventListener("dragend", function() {
      for (const it of items) {
        it.classList.remove("hint");
        it.classList.remove("active");
      }
    });
    i.addEventListener("dragover", function(evt) {
      evt.preventDefault();
    });
    // on drop reorder the list items
    // eslint-disable-next-line no-loop-func
    i.addEventListener("drop", function(evt) {
      evt.preventDefault();
      if (this !== current) {
        let currentpos = 0;
        let droppedpos = 0;
        for (let it = 0; it < items.length; it++) {
          if (current === items[it]) {
            currentpos = it;
          }
          if (this === items[it]) {
            droppedpos = it;
          }
        }
        if (currentpos < droppedpos) {
          this.parentNode.insertBefore(current, this.nextSibling);
        } else {
          this.parentNode.insertBefore(current, this);
        }
      }
    });
  }
}
