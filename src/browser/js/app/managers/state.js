var widgetManager = require('./widgets'),
    {icon, Popup, upload} = require('../ui/utils'),
    {saveAs} = require('file-saver')


var StateManager = class StateManager {

    constructor() {

        this.state = []

        this.valueStateQueue = {}
        this.valueOldPropQueue = {}
        this.valueNewPropQueue = {}
        this.queueCounter = 0

    }

    get() {

        var data = []

        for (let i in widgetManager.widgets) {

            var widget = widgetManager.widgets[i]

            if (widget.setValue && widget.getValue) {

                var v = widget.getValue()

                if (v!=undefined) {

                    data.push([widget.getProp('id'),v])
                    continue

                }

            }
        }

        return data

    }

    set(preset,send) {

        for (let i in preset) {

            var data = preset[i],
                widgets = widgetManager.getWidgetById(data[0])

            if (widgets.length) {

                for (var j=widgets.length-1;j>=0;j--) {

                    if (widgets[j].setValue) {

                        widgets[j].setValue(data[1],{send:send,sync:true})

                    }

                }

            }

        }

    }

    send(options) {

        for (let i in widgetManager.widgets) {

            var widget = widgetManager.widgets[i]

            if (widget.sendValue) {
                widget.sendValue(null, options)
            }
        }

    }

    load() {

        upload('.state', (path, result)=>{
            this.set(JSON.parse(result),true)
            this.state = result
        }, (e)=>{
            new Popup({title:icon('exclamation-triangle')+'&nbsp; Error', content: 'Failed to upload state file.', closable:true})
        })

    }

    save() {

        var state = JSON.stringify(this.get(),null,'    ')
        var blob = new Blob([state],{type : 'application/json'})
        saveAs(blob, new Date().toJSON().slice(0,10)+'_'+new Date().toJSON().slice(11,16) + '.state')

    }

    quickSave(state) {

        if (state) {

            this.state = state

        } else {

            this.state = this.get()

        }

    }

    quickLoad() {

        this.set(this.state,true)

    }

    pushValueState(id, value) {
        this.valueStateQueue[id] = value
    }

    pushValueOldProp(id, value) {
        this.valueOldPropQueue[id] = typeof value == 'object' ? JSON.stringify(value) : value
    }

    pushValueNewProp(id, value) {
        this.valueNewPropQueue[id] = typeof value == 'object' ? JSON.stringify(value) : value
        if (this.queueCounter == 0) this.flush()
    }

    flush(){
        for (let id in this.valueStateQueue) {
            if (this.valueStateQueue[id] !== undefined) {
                for (let w of widgetManager.getWidgetById(id)) {
                    w.setValue(this.valueStateQueue[id], {sync: true})
                }
            }
        }

        for (let id in this.valueNewPropQueue) {
            if (this.valueNewPropQueue[id] != this.valueOldPropQueue[id]) {
                for (let w of widgetManager.getWidgetById(id)) {
                    w.setValue(w.getProp('value'), {sync: true})
                }
            }
        }

        this.valueStateQueue = {}
        this.valueOldPropQueue = {}
        this.valueNewPropQueue = {}
    }

    incrementQueue() {
        this.queueCounter++
    }

    decrementQueue() {
        this.queueCounter--
        if (this.queueCounter == 0) this.flush()
    }

}

var stateManager = new StateManager()

module.exports = stateManager
