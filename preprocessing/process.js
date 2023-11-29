const CLASS_NAME_REGEX = /([a-z0-9\-:!]+)-\[(.+)\]/i;
const SIZE_MODIFIERS = {
    "md:": "768px",
    "lg:": "1024px",
    "xl:": "1366px"
};

const PROPERTY_MAPPING = {
    "bg": "background",
    "color": "color",
    // Add more mappings here as needed
};

function escapeClassName(className) {
    return className
        .replace(/!/g, "\\!")
        .replace(/:/g, "\\:")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]");
}

function addCSSRule(selector, property, value, important = false) {
    return `${selector} {
        ${property}: ${value}${important ? " !important" : ""};
    }\n`;
}


function processHTML(htmlString) {
    let styleTagContent = "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    doc.body.querySelectorAll("*").forEach((elem) => {
        const classList = elem.className.split(/\s+/);
        classList.forEach((className) => {
            const match = className.match(CLASS_NAME_REGEX);
            if (match) {
                let prefix = match[1] || "";
                let value = match[2].replace(/_/g, " ");
                let escapedClassName = escapeClassName(className);
                let ruleAdded = false;
                let important = false;

                if (value.startsWith("--")) {
                    value = `var(${value})`;
                }

                if (prefix.startsWith("!")) {
                    important = true;
                    prefix = prefix.slice(1);
                }

                let property = PROPERTY_MAPPING[prefix];
                if (!property) {
                    // If there's no mapping for the prefix, use the prefix as the property
                    property = prefix;
                }

                if (prefix.startsWith("hover:")) {
                    styleTagContent += addCSSRule(`.${escapedClassName}:hover`, property, value, important);
                    ruleAdded = true;
                }

                for (const [modifier, minWidth] of Object.entries(SIZE_MODIFIERS)) {
                    if (!ruleAdded && prefix.startsWith(modifier)) {
                        styleTagContent += `@media (min-width: ${minWidth}) {
                            ${addCSSRule(`.${escapedClassName}`, property, value, important)}
                        }\n`;
                        ruleAdded = true;
                        break;
                    }
                }

                if (!ruleAdded) {
                    styleTagContent += addCSSRule(`.${escapedClassName}`, property, value, important);
                }
            }
        });
    });

    return `<style>\n${css_beautify(styleTagContent)}\n</style>\n\n${htmlString}`;
}
