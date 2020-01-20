export function pointInRect(x, y, rect) {
    return inRange(x, rect.x, rect.x + rect.width) &&
           inRange(y, rect.y, rect.y + rect.height);

}


function inRange(value, min, max) {
    return value >= Math.min(min, max) && value <= Math.max(min, max);
}


export function toJSON(node) {

    let propFix = { for: 'htmlFor', class: 'className' };
    let obj = {
      nodeType: node.nodeType,
    };
    if (node.tagName) {
      obj.tagName = node.tagName.toLowerCase();
    } else if (node.nodeName) {
      obj.nodeName = node.nodeName;
    }
    if (node.nodeValue) {
      obj.nodeValue = node.nodeValue;
    }

    // add styles
    if(node.style){
      obj.style = node.style
    }
    let attrs = node.attributes;
    if (attrs) {
      let attrNames = new Map();
      for (let i = 0; i < attrs.length; i++) {
        attrNames.set(attrs[i].nodeName, undefined);
      }
      // Add some special cases that might not be included by enumerating
      // attributes above. Note: this list is probably not exhaustive.

      if (obj.tagName === 'input') {
        if (node.type === 'checkbox' || node.type === 'radio') {
          attrNames.set('checked', false);
        } else if (node.type !== 'file') {
          // Don't store the value for a file input.
          attrNames.set('value', '');
        }
      } else if (obj.tagName === 'option') {
        attrNames.set('selected', false);
      } else if (obj.tagName === 'textarea') {
        attrNames.set('value', '');
      }else if (obj.tagName === 'line'){
        // obj.x1.baseVal.value = node.x1.baseVal.value
        // obj.x2.baseVal.value = node.x2.baseVal.value
        // obj.y1.baseVal.value = node.y1.baseVal.value
        // obj.y2.baseVal.value = node.y2.baseVal.value
        obj.x1 = node.x1.baseVal.value
        obj.x2 = node.x1.baseVal.value
        obj.y1 = node.x1.baseVal.value
        obj.y2 = node.x1.baseVal.value
      }


      let arr = [];
      for (let [name, defaultValue] of attrNames) {
        let propName = propFix[name] || name;
        let value = node[propName];
        if (value !== defaultValue) {
          arr.push([name, value]);
        }
      }
      if (arr.length) {
        obj.attributes = arr;
      }
    }
    let childNodes = node.childNodes;
    // Don't process children for a textarea since we used `value` above.
    if (obj.tagName !== 'textarea' && childNodes && childNodes.length) {
      let arr = (obj.childNodes = []);
      for (let i = 0; i < childNodes.length; i++) {
        arr[i] = toJSON(childNodes[i]);
      }
    }
    return obj;
  }

  
  export function toDOM(input) {
    let obj = typeof input === 'string' ? JSON.parse(input) : input;
    let propFix = { for: 'htmlFor', class: 'className' };
    let node;
   
    let nodeType = obj.nodeType;
    switch (nodeType) {
      //ELEMENT_NODE
      case 1: {
        
        

        if (obj.tagName === 'line'){

            node = document.createElementNS('http://www.w3.org/2000/svg','line');
            
            if (obj.attributes) {
              for (let [attrName, value] of obj.attributes) {

                if( ( attrName === 'x1')
                   ||(attrName === 'x2')
                   ||(attrName === 'y1')
                   ||(attrName === 'y2')
                  ){
                    continue;
                  }else{
                    let propName = propFix[attrName] || attrName;
                    // Note: this will throw if setting the value of an input[type=file]
                    node[propName] = value;
                  }
               
              
              }

            }

          const x1 = obj.x1.toString()
          const x2 = obj.x2.toString()
          const y1 = obj.y1.toString()
          const y2 = obj.y2.toString()

          node.setAttribute('x1', x1)
          node.setAttribute('x2', x2)
          node.setAttribute('y1', y1)
          node.setAttribute('y2', y2)
        }else{

          node = document.createElement(obj.tagName);
            
            if (obj.attributes) {
              for (let [attrName, value] of obj.attributes) {
                let propName = propFix[attrName] || attrName;
                // Note: this will throw if setting the value of an input[type=file]
                node[propName] = value;
              }

            }
        }
      
        for(let [key,value] of Object.entries(obj.style)){

          if(Number.isNaN(parseInt(key))){
            node.style[key] = value
          }  
                    
        }
        break;
      }
      //TEXT_NODE
      case 3: {
        return document.createTextNode(obj.nodeValue);
      }
      //COMMENT_NODE
      case 8: {
        return document.createComment(obj.nodeValue);
      }
      //DOCUMENT_FRAGMENT_NODE
      case 11: {
        node = document.createDocumentFragment();
        break;
      }
      default: {
        // Default to an empty fragment node.
        return document.createDocumentFragment();
      }
    }
    if (obj.childNodes && obj.childNodes.length) {
      for (let childNode of obj.childNodes) {
        node.appendChild(toDOM(childNode));
      }
    }
    return node;
  }