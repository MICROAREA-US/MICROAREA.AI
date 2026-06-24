;(function() {
  var TRACKABLE_NODE_SELECTORS = ["a", "button", "input[type='submit']"]

  tinymce.create("tinymce.plugins.fintezaEventTracker", {
    /*
     * Initialize TinyMCE plugin
     */
    init: function(ed, url) {
      ed.addButton("fintezaEventTracker.setEventBtn", {
        title: ed.getLang("fintezaEventTracker.button.title"),
        cmd: "fintezaEventTracker.setEventBtn.popup",
        image: url + "../../../img/tinymce_icon.svg",
        onPostRender: function() {
          var btn = this

          /*
           * Enable button for allowed html tags only
           * Show button as pressed if html tag already have attached event
           */
          ed.on("NodeChange", function(e) {
            btn.disabled(!isNodeTrackable(e.element))
            btn.active(!!getEventName(e.element))
          })
        }
      })

      /*
       * Setup modal window
       */
      ed.addCommand("fintezaEventTracker.setEventBtn.popup", function(ui, v) {
        var node = ed.selection.getNode()

        ed.windowManager.open({
          title: ed.getLang("fintezaEventTracker.modal.title"),
          width: 400,
          height: 100,
          body: [
            {
              type: "container",
              layout: "flex",
              direction: "column",
              spacing: 8,
              items: [
                {
                  type: "label",
                  text: ed.getLang("fintezaEventTracker.input.label"),
                  multiline: true,
                  width: 360
                },
                {
                  type: "textbox",
                  name: "eventName",
                  minWidth: 360,
                  placeholder: ed.getLang("fintezaEventTracker.input.placeholder"),
                  value: getEventName(node)
                }
              ]
            }
          ],
          onsubmit: function(e) {
            setEventName(node, e.data.eventName)
          }
        })
      })
    },

    createControl: function(n, cm) {
      return null
    },

    getInfo: function() {
      return {
        longname: "Finteza Analytics",
        author: "Finteza Ltd.",
        authorurl: "https://www.finteza.com/",
        version: "1.0.1"
      }
    }
  })

  /*
   * Returns `true` if node can be used as an event trigger
   */
  function isNodeTrackable(node) {
    for (var index = 0; index < TRACKABLE_NODE_SELECTORS.length; index++) {
      var selector = TRACKABLE_NODE_SELECTORS[index]

      if (jQuery(node).is(selector)) {
        return true
      }
    }
    return false
  }

  function getEventName(node) {
    return node.getAttribute("data-fz-event")
  }

  function setEventName(node, name) {
    if (!!name) {
      node.setAttribute("data-fz-event", name)
    } else {
      node.removeAttribute("data-fz-event")
    }
  }

  tinymce.PluginManager.add(
    "fintezaEventTracker",
    tinymce.plugins.fintezaEventTracker
  )
})()
