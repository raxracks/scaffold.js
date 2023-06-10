let dirty = new Set();

function evaluate(element) {
  let val = Function(
    'element',
    `window.element=element;${element.template ? '' : 'return '}${element.expression}`)(element);
  if (val?.constructor?.name === "Array") return val?.join("");
  return val;
}

function $(initial) {
  let value = initial;
  let users = new Set();

  return [
    () => {
      if (element?.targetProperty && element.expression || element?.template && element.expression)
        users.add(element);
      return value;
    },
    (newValue) => {
      if (newValue !== value) {
        value = newValue;

        [...users].forEach(user => {
          user.newValue = evaluate(user);;
          dirty.add(user);
        });
      }
    }];
}

function updateDirty() {
  [...dirty].forEach(element => {
    element[element.targetProperty] = element.newValue;
  });

  dirty.clear();

  requestAnimationFrame(updateDirty);
}
requestAnimationFrame(updateDirty);

function parse(element) {
  [...element.attributes].forEach(({ name, value }) => {
    if (name.startsWith(":")) {
      element.targetProperty = name === ":inner-html" ?
        "innerHTML" : name
          .slice(1)
          .split("-")
          .map((val, idx) =>
            idx === 0
              ? val.toLowerCase()
              : val[0].toUpperCase() + val.slice(1).toLowerCase()
          )
          .join("");

      element.expression = value;
      element[element.targetProperty] = evaluate(element);
    }
  });

}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("*").forEach(element => {
    parse(element);
  });


  document.querySelectorAll("template").forEach(template => {
    template.expression = `[...element.parentNode.children].forEach(child => {if(!child.template)child.remove();});${template.getAttribute("expression")}{[...element.content.children].forEach(child=>{let clone=child.cloneNode(true);parse(clone);element.parentNode.appendChild(clone)})}`;

    template.template = true;
    evaluate(template);
  });
});
