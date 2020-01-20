import React,{Component} from 'react';
import {pointInRect, toJSON, toDOM} from './utils.js'
import {Button} from 'reactstrap'
import _ from 'lodash'
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

    createShapeComponent = (name,left,top) => {

        let newComponent = document.createElement('div')
        const id = 'component_' + this.state.shape_components.length
        newComponent.id = id
        newComponent.className = name.replace('toolbox','shape')
        newComponent.className += ' shape'
        newComponent.draggable = true
        newComponent.style.position = 'absolute'
        newComponent.style.margin = '0'
        newComponent.style.zIndex = 999
        newComponent.style.left = left
        newComponent.style.top = top
        newComponent.addEventListener('dragstart', (e) => this.onDragStartShape(e,id,'canvas_shape'))
        // connector anchors
        let anchorElm = document.createElement('div')
        anchorElm.id = 'anchor1'
        anchorElm.className = 'con_anchor_top'
        anchorElm.draggable = true
        // anchorElm.draggable = true
        // anchorElm.addEventListener('dragstart',(e)=>{this.onDragStartAnchor(e, anchorElm.id)})
        anchorElm.addEventListener('mousedown', (e)=>{this.onMouseDownAnchor(e)})
        anchorElm.addEventListener('dragstart',(e)=>{
                                                     e.preventDefault()
                                                     e.stopPropagation()
                                                    })
        newComponent.appendChild(anchorElm)

        let wrapper = document.createElement('div')
        return newComponent
    }


    initializeLine = (id) => {
        let newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        newLine.setAttribute('id', id)
        // newLine.addEventListener('drop',e=>{e.preventDefault()})
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

    clearCanvas = ()=>{

        let canvas = document.getElementById('chart_window')
        while(canvas.firstChild) {
            canvas.removeChild(canvas.firstChild);
        }

        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svg.setAttribute('id','connector_canvas')
        canvas.appendChild(svg)
    
    }
    
    /** Event Handlers **/ 

    onDragStartToolbox = (e, id, cat) => {
        console.log('drag start',id);
        e.dataTransfer.setData('id',id)
        e.dataTransfer.setData('cat',cat)

    }

    onDragStartShape = (e, id,cat) => {

        e.dataTransfer.setData('id',id)
        e.dataTransfer.setData('cat',cat)
        this.setState({current_component: e.target})
    }


    onDragOverCanvas = (e) => {
        e.preventDefault()

        const current_component = this.state.current_component
        
        const canvas = document.getElementById('chart_window')
        const x = e.clientX  -canvas.offsetParent.offsetLeft - canvas.offsetLeft 
        const y = e.clientY - canvas.offsetParent.offsetTop - canvas.offsetTop

        // update line endpoint coordinates 
        if(current_component){

            let {shape_components} = this.state

            shape_components.forEach(shape_component => {
                if(shape_component.component.id === current_component.id){
    
                    shape_component.lines_from_self.forEach(lineElm =>{

                        lineElm.setAttribute('x1',x)
                        lineElm.setAttribute('y1',y)

                    })

                    shape_component.lines_to_self.forEach(lineElm =>{

                        lineElm.setAttribute('x2',x)
                        lineElm.setAttribute('y2',y)

                    })
    
    
                }
            }) 
        }
        
    
    }


    onMouseDownAnchor = (e) => {

        console.log('clikced')
        this.setState({isMouseDown: true})
        const id = 'con_line' + this.state.lines.length
        const newLine = this.initializeLine(id)
        let lines = this.state.lines
        lines.push(newLine)
        this.setState({lines})

        document.getElementById('connector_canvas').appendChild(newLine)
        this.setState({ current_line_id: id, current_anchor:e.target})
    }

    onMouseDownCanvas = (e) => {

        const canvas = document.getElementById('chart_window')
        const x = e.clientX  -canvas.offsetParent.offsetLeft - canvas.offsetLeft 
        const y = e.clientY - canvas.offsetParent.offsetTop - canvas.offsetTop
        let rect = this.state.current_anchor ? Object.assign(this.state.current_anchor) : null

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
        let current_component = this.state.current_anchor.parentElement
        const className = targetElm.className

        if (typeof(className) === 'string' 
            && className.split(' ').includes('shape')
            && current_component.id !== targetElm.id
            ){


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

        this.setState({current_anchor:null})

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

     
    

    onDropCanvas = (e) => {

        e.preventDefault()
        const category = e.dataTransfer.getData('cat')

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
      
        if(category === 'toolbox-shape'){
            
            const newComponent = this.createShapeComponent(name,left, top)        
            canvas.appendChild(newComponent)

            let {shape_components} = this.state
            shape_components.push({component:newComponent,
                                   lines_from_self:[],
                                   lines_to_self:[]
                                  })
            this.setState({shape_components})
        }

        else if(category === 'canvas_shape'){
            
            incoming_element.style.top = top
            incoming_element.style.left = left
        }
        
        this.setState({current_component:null})
    }


    handleClick = e => {
        const name = e.target.id
        if(name === 'save'){
            
            this.saveToLocalStorage()
        }else{

            console.log(this.state)
            this.clearCanvas()
            const {shape_components,lines} = this.loadFromLoacalStorage()
            
            this.setState({shape_components,lines},()=> this.drawChart(shape_components))

        }
        
    }


    drawChart = (shape_components) => {

        // Draw shape components on to canvas div
        shape_components.forEach(shape_component => {
            
            let {component} = shape_component

            // Attach event Listeners
            const {id} = component
            component.addEventListener('dragstart', (e) => this.onDragStartShape(e,id,'canvas_shape'))
            document.getElementById('chart_window').appendChild(component)
            
            const anchorElm = component.children[0]
            anchorElm.addEventListener('mousedown', (e)=>{this.onMouseDownAnchor(e)})
            anchorElm.addEventListener('dragstart',(e)=>{
                                                     e.preventDefault()
                                                     e.stopPropagation()
                                                    })
            // Draw lines on to connector canvas svg
            let {lines_from_self} = shape_component
            let {lines_to_self} = shape_component

            lines_from_self.forEach(line_fs =>{
                document.getElementById('connector_canvas').appendChild(line_fs) 
            })

            // lines_to_self.forEach(line_ts =>{
            //     document.getElementById('connector_canvas').appendChild(line_ts) 
            // })
            

        })
       
    }


    saveToLocalStorage = () => {

        let shape_components = _.cloneDeep(this.state.shape_components)

        // Stringify all the DOM elements
        shape_components = shape_components.map(shape_component => {
                
                shape_component.component = toJSON(shape_component.component)
                
                shape_component.lines_from_self = shape_component.lines_from_self.map(line_fs => {
                    return toJSON(line_fs)
                })

                shape_component.lines_to_self = shape_component.lines_to_self.map(line_ts => {
                    return toJSON(line_ts)
                })

                return shape_component


            })
        console.log('saved state',this.state)
        // Stringfy global line elements
        let lines = Object.assign(this.state.lines) 
        lines = lines.map(line => (toJSON(line)))

        const flow_chart = JSON.stringify({shape_components,lines})
        localStorage.setItem('flow_chart',flow_chart)
    }

    
    loadFromLoacalStorage = () => {

        let {shape_components,lines} = JSON.parse(localStorage.getItem('flow_chart'))
        lines = lines.map(line => (toDOM(line)))
        // Parse all the DOM node objects and format them back to DOM node represenation
        shape_components = shape_components.map(shape_component => {

            shape_component.component = toDOM(shape_component.component)

            shape_component.lines_from_self = shape_component.lines_from_self.map(line_fs => {
                return toDOM(line_fs)
            })

            shape_component.lines_to_self = shape_component.lines_to_self.map(line_ts => {
                return toDOM(line_ts)
            })

            return shape_component
        })

        return {shape_components,lines}
    }
    

    render(){

        const toolbox_shapes = ['toolbox_triangle', 'toolbox_square', 'toolbox_circle']
                               .map(item => {
                                    
                                    return (<div  className='toolbox-shape'
                                                id={item}
                                                key={item}
                                                draggable
                                                style={{cursor:'move'}}
                                                onDragStart= {e => this.onDragStartToolbox(e, item, 'toolbox-shape' )}
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
                 onDrop={e => this.onDropCanvas(e)}
                 onMouseDown={e => this.onMouseDownCanvas(e)}
                 onDragOver={e =>this.onDragOverCanvas(e)}
                >
                    <svg id='connector_canvas'></svg>
                </div>
                {/* Actions panel */}
                
                <div className='actions'>
                  <Button 
                   outline
                   id="save"
                   color="warning"
                   onClick={e => this.handleClick(e)}
                  >
                  Save Chart
                  </Button>
                  <Button 
                   outline
                   id="load"
                   color="warning"
                   onClick={e => this.handleClick(e)}
                  >
                  Load Chart
                  </Button>


                </div>
            </div>
        )
    }
}