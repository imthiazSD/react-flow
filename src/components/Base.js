import React,{Component} from 'react';
import {pointInRect, toJSON, toDOM, createShapeComponent} from './utils.js'
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
        const x = e.clientX - canvas.offsetParent.offsetLeft - canvas.offsetLeft 
        const y = e.clientY - canvas.offsetParent.offsetTop - canvas.offsetTop

        // update line endpoint coordinates 
        if(current_component){

            let shape_components = _.cloneDeep(this.state.shape_components) 

            shape_components.forEach(shape_component => {

                if(shape_component.component.id === current_component.id){
    
                    shape_component.lines_from_self.forEach(line_fs =>{

                        line_fs.setAttribute('x1',x)
                        line_fs.setAttribute('y1',y)

                    })

                    shape_component.lines_to_self.forEach(line_ts =>{

                        line_ts.setAttribute('x2',x)
                        line_ts.setAttribute('y2',y)

                    })
    
    
                }
            }) 
        }
        
    
    }


    onMouseDownAnchor = (e) => {

        console.log('clikced')
        this.setState({isMouseDown: true})
        let lines = _.cloneDeep(this.state.lines) 
        const id = 'con_line' + lines.length
        const newLine = this.initializeLine(id)
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

            rect = {    x      : rect.offsetParent.offsetLeft + 23,
                        y      : rect.offsetParent.offsetTop + 50,
                        width  : rect.offsetWidth,
                        height : rect.offsetHeight
                   }
            // rect = {    x      : 23,
            //             y      : 50,
            //             width  : rect.offsetWidth,
            //             height : rect.offsetHeight
            //     }
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
            let lines = _.cloneDeep(this.state.lines) 
            lines = lines.slice(0,-1)
            this.setState({lines})
        }

        this.setState({current_anchor:null})

    }

    onMouseMoveCanvas = (e) => {

        const {current_anchor} = this.state

        const canvas = document.getElementById('chart_window')
        const x1 = current_anchor.offsetParent.offsetLeft + current_anchor.offsetParent.offsetWidth/2
        const y1 = current_anchor.offsetParent.offsetTop  + current_anchor.offsetParent.offsetHeight/2
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
            
            let _this = this
            const newComponent = createShapeComponent(name, left, top, _this)        
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

            const shape_components = _.cloneDeep(this.loadFromLoacalStorage().shape_components)
            const lines = _.cloneDeep(this.loadFromLoacalStorage().lines)
            
            this.setState({shape_components,lines},()=> this.drawChart(shape_components,lines))

        }
        
    }


    drawChart = (shape_components,lines) => {

        // Draw shape components onto canvas div
        
        shape_components.forEach(shape_component => {
            
            let {component} = shape_component

            // Attach event Listeners
            const {id} = component
            component.addEventListener('dragstart', (e) => this.onDragStartShape(e,id,'canvas_shape'))
            document.getElementById('chart_window').appendChild(component)
            
            const anchorElm = component.children[1]
            anchorElm.addEventListener('mousedown', (e)=>{this.onMouseDownAnchor(e)})
            anchorElm.addEventListener('dragstart',(e)=>{
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        })
            
            /** Append the line objects to lines_from_self and lines_to_self array
                of the shape_component, to avoid the cloning the objects.
                We need the reference of the same line object in both 
                lines_from_self and lines_to_self array
            */
           
            lines.forEach(line => {

             shape_components = shape_components.map(shape_component => {

                   shape_component.lines_from_self = shape_component.lines_from_self.map(line_fs =>{

                                        if(line.id === line_fs.id){ return line}
                                        else{ return line_fs}
                                    })

                   shape_component.lines_to_self = shape_component.lines_to_self.map(line_ts =>{

                                        if(line.id === line_ts.id){ return line}
                                        else{ return line_ts}
                                    })

                    return shape_component

                })

                // Draw lines onto connector canvas svg
                document.getElementById('connector_canvas').appendChild(line) 
            })

            this.setState({shape_components})




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
        let lines = _.cloneDeep(this.state.lines)
        lines = lines.map(line => (toJSON(line)))

        const flow_chart = JSON.stringify({shape_components,lines})
        localStorage.setItem('flow_chart',flow_chart)
    }

    
    loadFromLoacalStorage = () => {

        let flow_chart = JSON.parse(localStorage.getItem('flow_chart'))
        
        let shape_components = _.cloneDeep(flow_chart.shape_components)
        let lines = _.cloneDeep(flow_chart.lines)

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

        console.log('localstrge state bfre',this.state.shape_components)

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