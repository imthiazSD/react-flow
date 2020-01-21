import React from 'react'

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

        obj.x1 = node.x1.baseVal.value
        obj.x2 = node.x2.baseVal.value
        obj.y1 = node.y1.baseVal.value
        obj.y2 = node.y2.baseVal.value
      
      }else if(obj.tagName === 'polygon'){

        obj.custom_points = []
        for(let value of Object.values(node.points)){

           obj.custom_points.push({x:value.x, y: value.y})

        }

      }else if (obj.tagName === 'circle'){
        obj.cx = node.cx.baseVal.value
        obj.cy = node.cy.baseVal.value
        obj.r = node.r.baseVal.value
      
      }else if(obj.tagName === 'svg'){
        obj.viewBox = node.viewBox.baseVal

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

          
        }else if(obj.tagName === 'polygon'){
          
          let points_string = ''

          obj.custom_points.forEach(point => {
          
            points_string += `${point.x} ${point.y}, `
          
          })

          

          node = document.createElementNS('http://www.w3.org/2000/svg','polygon');       

          if (obj.attributes) {
            for (let [attrName, value] of obj.attributes) {

              if(attrName === 'points'){
                continue;
              }else{
                let propName = propFix[attrName] || attrName;
                // Note: this will throw if setting the value of an input[type=file]
                node[propName] = value;
              }
              
            }

          }
          
          points_string = points_string.slice(0,-2)
          node.setAttribute('style', '')
          node.setAttribute('fill', '#FFF')
          node.setAttribute('points',points_string)


        }else if(obj.tagName === 'circle'){

          node = document.createElementNS('http://www.w3.org/2000/svg','circle');

          node.setAttribute('style', '')
          node.setAttribute('fill', '#FFF')
          node.setAttribute('cx', obj.cx)
          node.setAttribute('cy', obj.cy)
          node.setAttribute('r', obj.r)

        }else if(obj.tagName === 'svg'){

          const {x, y, width, height} = obj.viewBox
          let svg_viewbox = `${x} ${y} ${width} ${height}`
          
          node = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

          node.style.position = 'relative'
          node.style.display = 'block'
          node.style.width = '100%'
          node.style.height = '100%'
          node.style.pointerEvents = 'none'
          node.setAttribute('viewbox',svg_viewbox)
          node.setAttribute('class','svg_shapes')



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



export function createShapeComponent(name,left,top,owner){

    let newComponent = document.createElement('div')
    const id = 'component_' + owner.state.shape_components.length
    newComponent.id = id
    // newComponent.className = name.replace('toolbox','shape')
    newComponent.className += ' shape'
    newComponent.className += ' canvas_shape'
    newComponent.draggable = true
    newComponent.style.position = 'absolute'
    newComponent.style.margin = '0'
    newComponent.style.zIndex = 999
    newComponent.style.left = left
    newComponent.style.top = top

    let componentShape = name.split('_')[1]
  
    let shapeElement;

    const width = 60
    const height = 60
    const viewBox = '0 0 60 60'
    const color = '#FFF'

    const namespace = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(namespace,'svg')
    const svg_viewbox = `0 0 ${width} ${height}`
    svg.style.position = 'relative'
    svg.style.display = 'block'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.setAttribute('viewbox',svg_viewbox)
    svg.setAttribute('class','svg_shapes')
    svg.style.pointerEvents = 'none'
  
    // svg shapes shapes 

    // Triangle
    const triangle = document.createElementNS(namespace, 'polygon')
    const triangle_points = `0 ${height}, ${width/2} 0, ${width} ${height}`
    triangle.setAttribute('style', '')
    triangle.setAttribute('fill', color)
    triangle.setAttribute('points', triangle_points)


    // Square
    const square = document.createElementNS(namespace, 'polygon')
    const square_points = `0 0, ${width} 0, ${width} ${width}, 0 ${height}`
    square.setAttribute('style', '')
    square.setAttribute('fill', color)
    square.setAttribute('points', square_points)

    // Circle
    const circle = document.createElementNS(namespace, 'circle')
    circle.setAttribute('style', '')
    circle.setAttribute('fill', color)
    circle.setAttribute('cx',`${width/2}`)
    circle.setAttribute('cy',`${width/2}`)
    circle.setAttribute('r',`${width/2}`)


    switch(componentShape){

      case 'triangle':
          svg.appendChild(triangle)
          shapeElement = svg
          break;

      case 'square':
          svg.appendChild(square)
          shapeElement = svg
          break;

      case 'circle':
        svg.appendChild(circle)
        shapeElement = svg
        break;

      default:
        svg.appendChild(square)
        shapeElement = svg
        break;
            
    }

    newComponent.appendChild(shapeElement) 


    newComponent.addEventListener('dragstart', (e) => owner.onDragStartShape(e,id,'canvas_shape'))
    // connector anchors
    let anchorElm = document.createElement('div')
    anchorElm.id = 'anchor1'
    anchorElm.className = 'con_anchor_top'
    anchorElm.draggable = true

    anchorElm.addEventListener('mousedown', (e)=>{owner.onMouseDownAnchor(e)})
    anchorElm.addEventListener('dragstart',(e)=>{
                                                 e.preventDefault()
                                                 e.stopPropagation()
                                                })
    newComponent.appendChild(anchorElm)

    return newComponent
}