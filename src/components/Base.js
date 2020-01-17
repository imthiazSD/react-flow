import React,{Component} from 'react';
import {pointInRect} from './utils.js'
export default class Base extends Component{
    
    constructor(props){
        super(props)

        this.state = {
            shape_components : [],
            lines : [],
            current_line_id : ''
        }
    }


    /** Helper methods **/ 

   

    initializeLine = (id) => {
        let canvas =  document.getElementById('connector_canvas')
        let newLine = document.createElementNS('http://www.w3.org/2000/svg','line');

        newLine.setAttribute('id', id)
        return newLine
    }
  
  
    updateLine = (id,coordinates) => {

        let line = document.getElementById(id)
        
        const {x1,x2,y1,y2} = coordinates
        line.setAttribute('x1',x1)
        line.setAttribute('y1', y1)
        line.setAttribute('x2', x2)
        line.setAttribute('y2', y2)

        
    }
    
    /** Event Handlers **/ 

    onDragOver = e => {
        e.preventDefault()
    }

    onDragStartShape = (e, id, cat) => {
        console.log('drag start',id);
        e.dataTransfer.setData('id',id)
        e.dataTransfer.setData('cat',cat)

    }

    onMouseMoveAnchor = (e) => {

        // console.log('mous moivng')
        // if(this.state.isMouseDown){
        //     const x1 = e.target.offsetParent.offsetLeft
        //     const y1 = e.target.offsetParent.offsetTop
        //     const x2 = e.clientX
        //     const y2 = e.clientY
    
        //     const coordinates = {x1,y1,x2,y2}
        //     this.updateLine(this.state.current_line_id, coordinates)
        // }
    }

    onMouseDownAnchor = (e) => {

        console.log('clikced')
        this.setState({isMouseDown: true})
        const id = 'con_line' + this.state.lines.length
        const newLine = this.initializeLine(id)
        let lines = this.state.lines
        lines.push(newLine)
        this.setState({lines})
        // this.setState({})

        // let {shape_components} = this.state
        // shape_components = shape_components.map(item => {

        //     if(item.component.id === e.target.parentElement.id){
                
        //          let lines_from_self = item.lines_from_self
        //          lines_from_self.push(newLine)
        //          return {...item,lines_from_self}
        //     }
        //     else{ return item}
        // })


        document.getElementById('connector_canvas').appendChild(newLine)
        this.setState({ current_line_id: id, current_anchor:e.target})
    }

    onMouseDownCanvas = (e) => {

        const canvas = document.getElementById('chart_window')
        const x = e.clientX  -canvas.offsetParent.offsetLeft - canvas.offsetLeft 
        const y = e.clientY - canvas.offsetParent.offsetTop - canvas.offsetTop
        let rect = this.state.current_anchor
        // const left = ( e.clientX 
        //     -canvas.offsetParent.offsetLeft
        //     -canvas.offsetLeft 
        //     -incoming_element.offsetWidth/2 ).toString() + 'px'
        if(rect){

            rect = {    x      : rect.offsetParent.offsetLeft,
                        y      : rect.offsetParent.offsetTop,
                        width  : rect.offsetWidth,
                        height : rect.offsetHeight
                   }
            console.log('cx cy',x,y)
            console.log('rect',rect)
            if(pointInRect(x,y,rect)){
                canvas.addEventListener('mousemove',this.onMouseMoveCanvas);
                canvas.addEventListener('mouseup',this.onMouseUpCanvas);
                console.log('true')
            }else{
                console.log('false')
            }
        }
      
     
    }

    onMouseUpCanvas = (e) => {

        const canvas = document.getElementById('chart_window')
        canvas.removeEventListener('mousemove',this.onMouseMoveCanvas);
        canvas.removeEventListener('mouseup',this.onMouseUpCanvas);
        
        const x = e.clientX 
        const y = e.clientY 
        let targetElm = document.elementFromPoint(x, y)
        const className = targetElm.className

        if (typeof(className) === 'string' && className.split(' ').includes('shape')){


            let newLine = document.getElementById(this.state.current_line_id)
            let {shape_components} = this.state
            
            // append line to lines_from_self of the origin component

            shape_components = shape_components.map(item => {
                
                let current_component = this.state.current_anchor.parentElement
                if(item.component.id === current_component.id){
                    
                     let lines_from_self = item.lines_from_self
                     lines_from_self.push(newLine)
                     return {...item,lines_from_self}
                }else{ return item}
            })
            
            // append line to lines_to_self of the target component

            shape_components = shape_components.map(item => {
                
                if(item.component.id === targetElm.id){
                    
                     let lines_to_self = item.lines_to_self
                     lines_to_self.push(newLine)
                     return {...item,lines_to_self}
                }else{ return item}
            })

            this.setState({shape_components},()=>console.log('state is',this.state))

        }else{

            // remove the line from the canvas and state
            let lineElm = document.getElementById(this.state.current_line_id)
            lineElm.parentNode.removeChild(lineElm)
            let lines = this.state.lines
            lines.slice(0,-1)
            this.setState({lines})
        }

    }

    onMouseMoveCanvas = (e) => {

        const {current_anchor} = this.state

        const canvas = document.getElementById('chart_window')
        const x1 = current_anchor.offsetParent.offsetLeft 
        const y1 = current_anchor.offsetParent.offsetTop  
        const x2 = e.clientX - canvas.offsetParent.offsetLeft - canvas.offsetLeft
        const y2 = e.clientY - canvas.offsetParent.offsetTop - canvas.offsetTop

        const coordinates = {x1,y1,x2,y2}
        // console.log('on mouse move canv',coordinates)
        this.updateLine(this.state.current_line_id, coordinates)
    }

     
    createShapeComponent = (name,left,top) => {

        let newComponent = document.createElement('div')
        newComponent.id = 'component_' + this.state.shape_components.length
        newComponent.className = name.replace('toolbox','shape')
        newComponent.className += ' shape'
        newComponent.style.position = 'absolute'
        newComponent.style.margin = '0'
        newComponent.style.zIndex = 999
        newComponent.style.left = left
        newComponent.style.top = top

        // connector anchors
        let anchorElm = document.createElement('div')
        anchorElm.id = 'anchor1'
        anchorElm.className = 'con_anchor_top'
        // anchorElm.draggable = true
        // anchorElm.addEventListener('dragstart',(e)=>{this.onDragStartAnchor(e, anchorElm.id)})
        anchorElm.addEventListener('mousemove', (e)=>{this.onMouseMoveAnchor(e)})
        anchorElm.addEventListener('mousedown', (e)=>{this.onMouseDownAnchor(e)})
        newComponent.appendChild(anchorElm)
        return newComponent
    }

    onDropCanvas = (e) => {
        
        
        if(e.dataTransfer.getData('cat') === 'toolbox-shape'){
            e.preventDefault()
            let canvas = document.getElementById('chart_window')
            let name = e.dataTransfer.getData('id')
            let incoming_element = document.getElementById(name)

            const left = ( e.clientX 
                          -canvas.offsetParent.offsetLeft
                          -canvas.offsetLeft 
                          -incoming_element.offsetWidth/2 ).toString() + 'px'
            const top = ( e.clientY
                         -canvas.offsetParent.offsetTop
                         -canvas.offsetTop 
                         -incoming_element.offsetHeight/2).toString() + 'px'
            // const left = (e.clientX - - canvas. incoming_element.offsetWidth/2 ).toString() + 'px'
            // const top = (e.clientY - canvas.offsetTop - incoming_element.offsetHeight/2).toString() + 'px'

            const newComponent = this.createShapeComponent(name,left, top)        
            canvas.appendChild(newComponent)

            let {shape_components} = this.state
            shape_components.push({component:newComponent,
                                   lines_from_self:[],
                                   lines_to_self:[]
                                  })
            this.setState({shape_components})
        }
        

    }


    render(){

        const toolbox_shapes = ['toolbox_triangle', 'toolbox_square', 'toolbox_circle']
                               .map(item => {
                                    
                                    return (<div  className='toolbox-shape'
                                                id={item}
                                                key={item}
                                                draggable
                                                style={{cursor:'move'}}
                                                onDragStart= {e => this.onDragStartShape(e, item, 'toolbox-shape' )}
                                                //   onMouseDown={e => this.HandlemouseDown(e)} 
                                                >
                                                </div>)
                                    
                                    
                                    });

        return(
            <div id="app-container">
                
                {/* Tool box pane */}
                <div className="toolbox">
                    {toolbox_shapes}
                </div>

                {/* Chart Window canvas area */}
                <div 
                 id="chart_window"
                 onDragOver={e => this.onDragOver(e)}
                 onDrop={e => this.onDropCanvas(e)}
                 onMouseDown={e => this.onMouseDownCanvas(e)}
                >
                    <svg id='connector_canvas'
                    ></svg>
                </div>
            </div>
        )
    }
}