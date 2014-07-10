DRIB_MODULE = (function(){

    var Shot = Backbone.Model.extend({
        defaults: {
            "shotId": "" //id of the dribble shot
          , "image_url": "" //url of the image
          , "image_teaser_url": "" //teaser url
          , "title": "" //title of the shot
          , "short_url": "" //url to the shot
          , "likes": ""
          , "views": ""
          , "author": ""
          , "comments": ""
          , "categories": []
        },
        initialize: function(){
            this.on("create", function(model){
                console.log('Created Favorite')
            })
            this.on("change", function(model){
                console.log('Favorite Changes')
            })
            this.on("error", function(model, error){
                console.log(error)
            })
        }
    })

    var Category = Backbone.Model.extend({
        defaults: {
           "name": "" //title of the shot
        },
        initialize: function(){
            this.on("create", function(model){
                console.log('Created Category')
            })
            this.on("change", function(model){
                console.log('Category Changes')
            })
            this.on("error", function(model, error){
                console.log(error)
            })
        }
    })

    var ShotCollection = Backbone.Collection.extend({
        localStorage: new Backbone.LocalStorage("ShotCollection"),
        model: Shot
    });

    var CategoryCollection = Backbone.Collection.extend({
        localStorage: new Backbone.LocalStorage("CategoryCollection"),
        model: Category
    });

    var ShotView = Backbone.View.extend({
        className: 'shot',
        template: _.template( $('#shot-favorite-tpl').html() ),
        events: {
            "click .shot-image" : "overlay",
            "click .shot-list" : "editList",
            "click .shot-unfavorite" : "unfavorite",
            "click .shot-overlay-choice-unfavorite" : "unfavorite"
        },
        initialize: function(){
            this.$el.addClass('four columns ')
            this.$el.attr('data-shotid', this.model.attributes.shotId)

            this.model.attributes.shotHeight = DRIB.shotHeight
            this.render()
        },
        render: function(){
            var imageQuality = localStorage.getItem('DRIB-setting-shotImage') || DRIB.shotImage
              , rendered

            //grab the selected quality from the model
            this.model.attributes.image = this.model.attributes[imageQuality]

            rendered = this.template( this.model.toJSON() )

            $(this.el).html( rendered )

            return this //awe shit, we chaniable
        },
        unfavorite: function(){
            this.model.destroy()
            this.remove()

            //maybe grab the global and remove from there
            DRIB.collections.shotCollection.remove( this.model )

            return false
        },
        editList: function(){
            //make this a help method, send model info to is

            //helper avaiable and should consider using it, but may be less expensive
            //to no use it
            DRIB.views.categoryModal = new CategoryModal({ 
                  modelInfo:this.model //send the info of the model
                , viewInfo : this //with the view info
            })

            return false
        },
        overlay: function(e){
            clickForOverlay(e, $(e.currentTarget) )
        }
    })

    var HeaderView = React.createBackboneClass({
        // el: '.header',
        template: _.template( $('#header-tpl').html() ),
        events: {
            "click .category-menu-panel" : "CategoryTogglePanel",
            "click .setting-menu-panel" : "SettingTogglePanel"
        },
        // still having issues with double tap
        // consider making this a plugin with a better syntax...
        // http://stackoverflow.com/a/8400852/240993
        // events: function() {
        //     var _events = { } // regular events can be here
        //     _events[DRIB.helper.clickevent + " .category-menu-panel"] = "CategoryTogglePanel";
        //     _events[DRIB.helper.clickevent + " .setting-menu-panel"] = "SettingTogglePanel";

        //     return _events;
        // },
        initialize: function(){
            this.render()
        },
        componentDidMount: function(){
            this.render()

            this.stickyHeader()
        },
        render: function(){
            // var rendered = this.template()

            // $(this.el).html( rendered )

            // this.stickyHeader()

            // return this //awe shit, we chaniable
            return React.DOM.div({className: "header-row header-top"}, [
		           		React.DOM.div({className: "mobile-menu left setting-menu-panel", onClick: this.SettingTogglePanel},  [
		           			React.DOM.span({className: "icon-menu"})
		           

		            	]),

		            	React.DOM.div({className: "title-container"}, [
		           			React.DOM.h1({className: "page-title"}, 'Dribbble Away')
		           

		            	]),

		            	React.DOM.div({className: "mobile-menu right category-menu-panel", onClick: this.CategoryTogglePanel},  [
		           			React.DOM.span({className: "icon-drawer"})
		           

		            	])
		        	],
		        	React.DOM.div({className: "header-row header-bottom"},[
		        		React.DOM.div({className: "search-container"})

		        	])
		        )
        },
        CategoryTogglePanel: function(){
             Backbone.trigger('panel/toggle/category');
        },
        SettingTogglePanel: function(){
             Backbone.trigger('panel/toggle/setting');
        },
        stickyHeader: function(){
            var triggerElement = $(".container") //element to he used to trigger the fixed header
              , header = this.el() //element of header, native js for perf on mobile
              , stickyClass = "stuck" // class to be used to give the fixed header a fixed position

            $(window).scroll(function(){
                var offset = 0,sticky = false,top = $(window).scrollTop();
                if (triggerElement.offset().top < top){
                    header.classList.add(stickyClass)
                    sticky = true;
                } else {
                    header.classList.remove(stickyClass)
                    header.removeAttribute('style')
                }
            });

        }
    })



    var BasePanelView = Backbone.View.extend({
        toggle: function(){
            var self = this
            this.$el.addClass('active')
            this.fetchRender()

            //for the specific stuff to happen when showing a panel
            //that needs not to be in the base
            this.onPanelShow()

            //show the overlay after the transiton of the panel to prevent spotty animation
            //from both the elements moving at the same time on mobile
            var afterAnimation =  function(event) {
                //prevent firing twice issue from having multiple transitions
                //http://stackoverflow.com/a/6328170/240993
                event.stopPropagation();
                if (event.originalEvent.propertyName === "-webkit-transform") {
                    DRIB.helper.trigger('overlay','on', self, 'hide')
                    $(this).unbind('webkitTransitionEnd')
                }
            }

            this.$el.bind('webkitTransitionEnd', afterAnimation);
        },
        close: function(){
            // this.$el.removeClass('active')
            this.$el.removeClass('edit-mode') //in the case of it categoryPanel having edit mode on
            DRIB.helper.trigger('overlay','off', this, 'hide')
            $('.overlay').remove()
        },
        fetchRender: function(){
            //get extended
        },
        onPanelShow: function(){
            //get extended
        }
    })

    var CategoryPanelView = BasePanelView.extend({
        className: 'side-panel category-side-panel',
        template: _.template( $('#category-panel-tpl').html() ),
        events: {
              "global panel/toggle/category" : "toggle"
            , "click .side-panel-close" : "close"
            , "click .side-panel-list-add" : "addCategory"
            , "click .side-panel-edit" : "editMode"
            , "click .list-category-trigger" : "showCategory"
            , "click .list-category-all" : "showCategory"
            , "click .list-category-delete" : "removeCategory"
            , "click .list-category-edit" : "editCategory"
        },
        initialize: function(){
            this.parent = this.options.parent
            this.listHeight = null //will hold the height of ul on initial load for re-rendering

            //WEIRD SHIT ALERT!!!
            //for some reason bind all is neede to grab this view
            //not used anywhere else...
            //ISSUE FOUND: the Backbone.Event bus  isnt sending 'this' to the method
            //create a fix for backbone global, although its a backbone issue
            _.bindAll(this, 'toggle')
        },
        render: function(){
            //need to create the categories obj for the template to grab
            var rendered = this.template({categories:this.categories})

            $(this.el).html( rendered )
            this.correctListHeight()
            this.categoryCount()

            this.viewAll()// a special li elem to be added

            return this //awe shit, we chaniable
        },
        viewAll: function(){
            var ul = this.$('.list-categories')
              , li = '<li class="list-category list-category-all" data-list="view-all" data-count="1">All Favorites<span class="list-category-count">'+ this.favoriteCount +'</span></li>'

            ul.prepend(li)
        },
        correctListHeight: function(){
           //since 100% height dont work, we need to do it manually
            var that = this
              , noHeightRendered = this.listHeight === null || this.listHeight === -50
              , height

            //when the browser keyboard bar comes up, it fucks the viewport, this will grab the initial height
            //so the height will be unfuckwitable!
            if( noHeightRendered ){
                height = $('.side-panel').height() - $('.side-panel-header').height() - $('.side-panel-create-list').height()-50
                that.listHeight = height//set the initial ul height
            }else{
                height = this.listHeight
            }

            this.$('.list-categories').css('height', height)
        },
        fetchRender: function(){
            var that = this
            $.when(
                DRIB.collections.shotCollection.fetch(),
                DRIB.collections.categoryCollection.fetch()
            )
            .done(function(){
                that.categories = DRIB.collections.categoryCollection.models
                that.favoriteCount = DRIB.collections.shotCollection.models.length
                //render after success to ensure the the categories are ready
                that.render()
            })
            .fail(function(){
                //do stuff for failing to fetch
            })

            //dev purposes for zepto since it doesnt have $.when natively...
            // DRIB.collections.categoryCollection.fetch({
            //     success: function(){
            //         that.categories = DRIB.collections.categoryCollection.models
            //         //render after success to ensure the the categories are ready
            //         that.render()
            //     }
            // })
        },
        addCategory: function() { //maybe make this a helper
            var model = this.options.modelInfo
              , categoryInput = this.$('.side-panel-list-input')
              , newCategoryName = categoryInput.val()

            //add that cat...
            if(newCategoryName.length > 0){//check to ensure its shit there
                DRIB.collections.categoryCollection.create({
                    name: newCategoryName
                })
            }else{
                alert('uh, enter a name')
            }

            //we need to fetch shit before we render shit
            this.fetchRender()

            return false
        },
        removeCategory: function(e){//refactor...
            var categoryElement = e.currentTarget.parentElement
              , categoryName = categoryElement.getAttribute('data-list')
              , currentlyActive = DRIB.collectionViews.shotCollectionView.category === categoryName
              , choice = confirm("You sure about this?? \n It will also remove " + categoryName + " from all your favorites");

            var searchAndDestoryCats = function(){
                //find the model with the selected category and remove it from the model
                _.find(DRIB.collections.shotCollection.models, function(shot) {
                    var categoriesOfShot = shot.attributes.categories,
                        index = categoriesOfShot.indexOf(categoryName);
                    if (index > -1) {
                        categoriesOfShot.splice(index, 1); //remove the cat
                        shot.save() //save the shot
                    }
                })

                //find the model and kill it
                DRIB.collections.categoryCollection.findWhere({
                    name: categoryName
                }).destroy()

                //remove the element, opposed to re-rendering the view
                categoryElement.remove()

                //if the category is being show, default the main view
                console.log('its gone...')
            }

            (choice === true) ? searchAndDestoryCats()
                              : console.log('we gonna keep it then')

            //make condition to check and see if the category is being shown, then update like so
            if( currentlyActive ){
                DRIB.helper.trigger('category/hide')
            }

            //stop the parent el from firing editCategory
            e.stopPropagation()
        },
        editCategory: function(e){//refactor...
            var categoryElement = e.currentTarget
              , categoryName = categoryElement.getAttribute('data-list')
              , newCategoryName = prompt("Enter the new category name", categoryName)
              , currentlyActive = DRIB.collectionViews.shotCollectionView.category === categoryName

            var searchAndChangeCats = function(){
                //find the model with the selected category and remove it from the model
                //if there are any...
                _.find(DRIB.collections.shotCollection.models, function(shot) {
                    var categoriesOfShot = shot.attributes.categories,
                        index = categoriesOfShot.indexOf(categoryName);
                    if (index > -1) {
                        categoriesOfShot[index] = newCategoryName //remove the cat
                        shot.save() //save the shot
                    }
                })

                //find the model and and change the name
                DRIB.collections.categoryCollection.findWhere({name: categoryName })
                .set({name: newCategoryName})
                .save()

                //re-render the view, yes this is lazy...
                //used bind() just to be fancy, isnt support everywhere though

                //check to see if its in edit mode
                //  if so,
                this.render()
                if( this.$el.hasClass('edit-mode') ) this.toggleCategoryTriggers()

                //make condition to check and see if the category is being shown, then update like so
                if( currentlyActive ){
                    DRIB.helper.trigger('notification/update/name', newCategoryName)
                }

                console.log('named? changed...')
            }.bind(this)

            //check to see if a name was selected
            if ( newCategoryName !== null ) {
               searchAndChangeCats()
            } else {
                console.log('we gonna keep it then')
            }
        },
        editMode: function(){
            var notInEditMode = !this.$el.hasClass('edit-mode')
              , that = this

            //turn on edit mode
            if( notInEditMode ){
                that.el.classList.add('edit-mode')//class to show the close icons

                //remove the .list-category-trigger from li elements so they wont trigger event
                //this is easier then undelegating the events
                this.toggleCategoryTriggers()

            }else{//off it goes
                that.el.classList.remove('edit-mode')
                this.toggleCategoryTriggers()
            }
        },
        toggleCategoryTriggers: function(){
            var categoryLists = this.$('.list-category')

            for (var i = 0; i < categoryLists.length; i++) {
                var categoryClass = categoryLists[i].classList
                //alternate classes
                categoryClass.toggle('list-category-trigger') //will initially be there
                categoryClass.toggle('list-category-edit') //will initially be hidden
            };
        },
        categoryCount: function(){
            var categories = DRIB.collections.shotCollection.pluck('categories')
              , combined = []

            combined = combined.concat.apply(combined, categories )

            var listedCategories = this.$('.list-category')
            for (var i = 0; i < listedCategories.length; i++) {
                var list = $(listedCategories[i])
                  , listCat = list.data('list')
                  , count = 0

                _.each(combined, function(usedCat){
                    if( usedCat === listCat ){
                        count++
                    }
                })
                //add this number to the
                list.attr('data-count', count).find('.list-category-count').text(count)
            };
        },
        showCategory: function(e){
            var category = $(e.currentTarget)
              , categoryName = category.data('list')
              , categoryCount = category.data('count')

            if(categoryCount > 0){
                DRIB.helper.trigger('category/show', categoryName)
                DRIB.helper.trigger('overlay','off', this, 'hide')
            }else{
                //make some error treatment
                alert('that category is empty...')
            }
        }
    })

    var SettingPanelView = BasePanelView.extend({
        className: 'side-panel setting-side-panel',
        template: _.template( $('#setting-panel-tpl').html() ),
        events: {
              "global panel/toggle/setting" : "toggle"
            , "click .side-panel-close"     : "close"
            , "click .side-panel-search"    : "search"
            , "click .panel-button-filter"  : "setFilter"
            , "click .panel-button-quality" : "setQuality"
            , "click .panel-button-grid"    : "setGridSize"
            , "click .panel-button-clear"    : "clearSettings"
        },
        initialize: function(){ //base
            this.parent = this.options.parent

            //this can be used for the recent searches
            this.listHeight = null //will hold the height of ul on initial load for re-rendering

            //WEIRD SHIT ALERT!!!
            //for some reason bind all is neede to grab this view
            //not used anywhere else...
            //ISSUE FOUND: the Backbone.Event bus  isnt sending 'this' to the method
            //create a fix for backbone global, although its a backbone issue
            //update: 1/12/14 - chris submitted a fix in the repo
            _.bindAll(this, 'toggle')
        },
        render: function(){
            //need to create the categories obj for the template to grab
            var rendered = this.template({categories:this.categories})

            $(this.el).html( rendered )
            this.correctListHeight()

            //needs to be fired after the templates is rendered
            // for the scripts to pick up the markup
            _.defer(function(){
                this.socialScripts()
            }.bind(this))

            return this //awe shit, we chaniable
        },
        onPanelShow: function(){
            //these will fire one the panel shows opposed to on the initial load
            this.filtering()
            this.imageQuality()
            this.gridSize()
        },
        filtering: function(){//could be merged with imageQuality/filtering
            var storedValue = localStorage.getItem('DRIB-setting-shotlist')

            //check localstorage for a setting
            if ( storedValue !== null ){ //if stored filter is avail
                //set to DRIB.shotList
                DRIB.shotList = storedValue

                //highlight the selected filter
                this.$(".panel-button-filter[data-filter='"+ storedValue  +"']").addClass('active')
            }
        },
        setFilter: function(e){
            // get selected button data and set class to active
            var selectedOption = $(e.currentTarget)
               , data = selectedOption.data('filter')

            this.$('.panel-button-filter.active').removeClass('active')
            selectedOption.addClass('active')

            DRIB.helper.trigger('shots/filtered', data)
        },
        imageQuality: function(){//could be merged with imageQuality/filtering
            var storedValue = localStorage.getItem('DRIB-setting-shotImage')

            //check localstorage for a setting
            if ( storedValue !== null ){ //if stored filter is avail
                //set to DRIB.shotList
                DRIB.shotImage = storedValue
            }else{
               storedValue = DRIB.shotImage
            }

            //highlight the selected filter
            this.$(".panel-button-quality[data-filter='"+ storedValue  +"']").addClass('active')
        },
        setQuality: function(e){
            // get selected button data and set class to active
            var selectedOption = $(e.currentTarget)
               , data = selectedOption.data('filter')

            this.$('.panel-button-quality.active').removeClass('active')
            selectedOption.addClass('active')

            localStorage.setItem('DRIB-setting-shotImage', data)
            //use this for not but
            //think of a way to go through all the loaded raw shots and load the hi res
            //or
            //reload them all...

            // DRIB.helper.trigger('shots/quality', data)
        },
        gridSize: function(){
            var storedValue = localStorage.getItem('DRIB-setting-shotGrid')

            //check localstorage for a setting
            if ( storedValue !== null ){ //if stored filter is avail
                //set to DRIB.shotList
                DRIB.shotGrid = storedValue
            }else{
               storedValue = DRIB.shotGrid
            }

            //highlight the selected filter
            this.$(".panel-button-grid[data-filter='"+ storedValue  +"']").addClass('active')
        },
        setGridSize: function(e){
            var selectedOption = $(e.currentTarget)
              , data = selectedOption.data('filter')

            this.$('.panel-button-grid.active').removeClass('active')
            selectedOption.addClass('active')

            localStorage.setItem('DRIB-setting-shotGrid', data)

            //change the grids and shit...
            DRIB.helper.trigger('gridSize', data)

            // just incase the viewport isn't long enough which switching to grid
            grabShots()
        },
        search: function(){
            //store val
            //show animation to choose popular or latest
            //show notification
            //close panel
            //change the url for grab shots
                //may need to modify grab shots function
                //
        },
        correctListHeight: function(){
            //since 100% height dont work, we need to do it manually
            var height

            //when the browser keyboard bar comes up, it fucks the viewport, this will grab the initial height
            //so the height will be unfuckwitable!
            if( this.listHeight === null ){//check
                height = $('.side-panel').height() - $('.side-panel-header').height() - $('.side-panel-create-list').height()+50
                this.listHeight = height//set the initial ul height
            }else{
                height = this.listHeight
            }
            // console.log(height)
            this.$('.side-panel-body').css('height', height)
        },
        socialScripts: function(){
            //facebook
            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s);
                js.id = id;
                js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=222653501241906";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

            //google plus
            (function() {
                var po = document.createElement('script');
                po.type = 'text/javascript';
                po.async = true;
                po.src = 'https://apis.google.com/js/platform.js';
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(po, s);
            })();

            //twitter
            !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');
        },
        clearSettings: function(){
            DRIB.helper.trigger('clearStorage')
        }
    })

    var CategoryModal = Backbone.View.extend({
        // el:'.modal', //incase to just show and hide the modal, easier for animations
        tagName: 'section', //for dev purposes: chrome tools quick with alignin divs
        events: {
              'click .overlay': 'close' //can remove since overlay is being added from helper
            , 'click .modal-close': 'close'
            , 'click .modal-shot-remove': 'unfavorite'
            , 'click .modal-list-add': 'addCategory'
            , 'click .list-category': 'selectCategory'
            , 'click .modal-shot-save': 'saveShot'
        },
        template: _.template( $('#category-modal-template').html() ),
        initialize: function() {
            this.listHeight = null //will hold the height of ul on initial load for re-rendering
            // $('body').addClass('overlay-open')
            DRIB.helper.trigger('overlay','on', this)
            //dev purposes: info from the model
            //console.log(this.options.modelInfo)

            //fetch or refresh the category collection here
            //no need to fetch it on itial render
           this.fetchRender()
        },
        fetchRender: function(){
            var that = this
            DRIB.collections.categoryCollection.fetch({
                success: function(){
                    that.categories = DRIB.collections.categoryCollection.models
                    //render after success to ensure the the categories are ready
                    that.render()
                }
            })
        },
        render: function() {
            var info = {} //obj seperate the model info from categories
              , rendered

            info.model = this.options.modelInfo.toJSON()
            info.categories = this.categories

            rendered = this.template( info )
            $(this.el).html( rendered )
            $('.container.main').append(this.el);

            this.loadSelectedCategories(info)

            this.correctListHeight()

            return this;
        },
        correctListHeight: function(){
            var noHeightRendered = this.listHeight === null || this.listHeight === -50
              , that = this
              , height

            //since 100% height dont work, we need to do it manually
            if( noHeightRendered ){
                height = window.innerHeight- $('.modal-header').height() - $('.modal-create-list').height()
                that.listHeight = height//set the initial ul height
            }else{
                height = this.listHeight
            }

            // var height = window.innerHeight- $('.modal-header').height() - $('.modal-create-list').height()
            this.$('.list-categories').css('height', height-150)
        },
        loadSelectedCategories: function(info){
            //once the categories are loaded, the categories the model has will he checked
            var categories = this.$('.list-category')
            for (var i = 0; i < categories.length; i++) {
                var category = $(categories[i])

                //check each of the avaiable categories against the model categories
                if (_.contains(info.model.categories, category.data('list'))) {
                    category.addClass('active')
                }
            };
        },
        unfavorite: function() {
            this.options.modelInfo.destroy() //click, click, bang! dead model

            if( this.options.rawviewInfo ){
                this.options.viewInfo.$el.remove() //remove that shot el. pow!
            }else{
                //if its from the raw shot "view"
                //we need to remove the fav class to revent back to regular raw shot
                this.options.rawViewInfo.removeClass('favorited').addClass('unfavorited')
            }

            this.close()  //close modal

            return false
        },
        addCategory: function() {
            var model = this.options.modelInfo
              , categoryInput = $('.modal-list-input')
              , newCategoryName = categoryInput.val()

            //add that cat...
            if(newCategoryName.length > 0){//check to ensure its shit there
                DRIB.collections.categoryCollection.create({
                    name: newCategoryName
                })
            }else{
                alert('uh, enter a name')
            }

            //we need to fetch shit before we render shit
            this.fetchRender()

            this.correctListHeight()

            return false
        },
        selectCategory: function(e) {
           var model = this.options.modelInfo
             , category = $(e.currentTarget)
             , categoryValue = category.data('list')

           category.toggleClass('active')
           //todo: add css animations

           return false
        },
        saveShot: function() {
            var model = this.options.modelInfo
              , selectedCategories = this.$('.active')
              , categoriesToSave = []

            //grab each of the select categories names to add to the array of the model
            for (var i = 0; i < selectedCategories.length; i++) {
                var category = $(selectedCategories[i]).data('list')
                categoriesToSave.push(category)
            };

            console.log('saved: '+categoriesToSave)

            //using set to make sure the model can still listen
            model.set('categories',categoriesToSave)
            model.save()

            //-re-render the shot view to see the change in action link verbiage
            if ( this.options.viewInfo ){
                this.options.viewInfo.render()
            }else if( this.options.rawViewInfo ){
                //need to do it manually with the raw shots...
                var hasCategories = this.options.modelInfo.attributes.categories.length > 0
                  , categoryButton = this.options.rawViewInfo.find('.shot-list')
                  , buttonContext

                //check to see if the model has cats or not
                //then change the verbiage of the button to match
                if (hasCategories) {
                    buttonContext = 'Edit Categories'
                } else {
                    buttonContext = 'Add to Category'
                }
                categoryButton.text(buttonContext)
            }

            //do some fancy animation here
            this.close()

           return false
        },
        show: function() {
           //do some fancy animation here
        },
        close: function() {
            this.remove()
            // $('body').removeClass('overlay-open')
            DRIB.helper.trigger('overlay','off', this)
        }
    });

    var MoreInfoModal = Backbone.View.extend({
        tagName: 'section', //for dev purposes: chrome tools quick with alignin divs
        events: {
              'click .overlay': 'close' //can remove since overlay is being added from helper
            , 'click .modal-close': 'close'
            , 'click .shot-list': 'editCategory'
            , 'click .shot-unfavorite': 'unfavorite'
            , 'click .shot-favorite': 'favorite'
        },
        template: _.template( $('#moreinfo-modal-template').html() ),
        initialize: function() {

            DRIB.helper.trigger('overlay','on', this)

            //if its a view model, change up some fields because we're lazy
            if( typeof this.options.shotInfo.author !== "undefined" ){
                var obj = this.options.shotInfo
                obj.player = {name: obj.author }
                obj.views_count = obj.views
                obj.likes_count = obj.likes
                obj.comments_count = obj.comments
            }

            this.render()
        },
        render: function() {
            var info = this.options.shotInfo
              , favoriteIdArray =  DRIB.collections.shotCollection.pluck('shotId')
              , rendered
              , check = info.shotId || info.id //condition for raw and fav shot

            if( _.contains( favoriteIdArray, check) ){
                info.favorited = true
            }else{
                info.favorited = false
            }

            rendered = this.template( info )

            $(this.el).html( rendered )
            $('.container.main').append(this.el);

            return this;
        },
        editCategory: function(){

        },
        unfavorite: function(){

        },
        favorite: function(){
            clickToFavotite(e)
        },
        show: function() {
           //do some fancy animation here
        },
        close: function() {
            this.remove()
            // $('body').removeClass('overlay-open')
            DRIB.helper.trigger('overlay','off', this)
        }
    });

    var ShotCollectionView = Backbone.View.extend({
        className: 'shots',
        initialize: function(){
            _.bindAll(this, 'render')
            //re render the collection view per every event that happens
            //this shouldnt be needed as the only time you should see the view is when selected in panel
            //leave for dev purposes
            // this.collection.bind('all', this.render)
            this.collection.bind('remove', this.updateNotification)

            //this should bte the bind used when finished deving
            // this.collection.bind('remove', this.render)
            this.render()
        },
        render: function(){
            var self = this
            var collection = this.collection
            self.$el.empty()
            collection.each(function(model){ //for each building make a view for them using the building model
                var view = new ShotView({
                    model: model, // current model
                    collection: collection // uses this collection declared at init
                })
                self.$el.append(view.render().el) //make a view per each building
            })
            return this // make this render chainable
        },
        updateNotification: function(){
            //lazy... i know, i know
            var count = this.length //grabs the amount of models

            //if notification is there, we will the number
            if( $('.notification').html() ){
                DRIB.helper.trigger('notification/update/count', count)
            }
        }
    })

    var ParentView = Backbone.View.extend({
        el: ".main",
        initialize: function(){
            DRIB.collections = {
                shotCollection: this.shotCollection = new ShotCollection(),
                categoryCollection: this.categoryCollection = new CategoryCollection()
            }

            //need to pass the parent as an "option" in both cases
            //to have access to its moms!
            DRIB.views.headerView = this.headerView = new HeaderView({parent: this})

            React.renderComponent(DRIB.views.headerView, $(".header")[0]);

            //overriding the $el because react isnt dont give it to us
            DRIB.views.headerView.$el = $(DRIB.views.headerView.el())

            DRIB.views.categoryPanelView = this.categoryPanelView = new CategoryPanelView({parent: this})

            DRIB.views.settingPanelView = this.settingPanelView = new SettingPanelView({parent: this})

            //init today, tomorrow and past collection views
            DRIB.collectionViews = {
                shotCollectionView: this.shotCollectionView = new ShotCollectionView({
                    collection:this.shotCollection //just in case
                })
            }
        },
        render: function(){
            console.log('Parent Rendered');
            $('.favorite-container').append( this.shotCollectionView.render().el )

            //dev pusposes: manually fire panel
            this.$el.after( this.categoryPanelView.render().el )

            this.$el.after( this.settingPanelView.render().el )

            //not showing initially, why? because it shows before the parent view shows
            //which makes it look tacky... yes this is cheap
            $('.load-more').removeClass('off')
        }
    })

    var AppRouter = Backbone.Router.extend({
        routes: {
            '': 'home', //empty string means the home page
        },
        initialize: function(){
            //init ParentContainerView
            // console.log('Router Started')

            DRIB.views.parentView = this.parentView = new ParentView()

            DRIB.views.parentView.render()

            // for dev pusposes...
            $.when(
                DRIB.collections.shotCollection.fetch()
            )
            .done(function(){

            })
            .fail(function(){
                //do stuff for failing to fetch
            })

            //works and ommited for now until the templates are established
            // TID.collections.pastEventCollection.fetch()
        },
        home: function(){
            //stuff here for home
        }
    })

    //load the shots to the page after the ajax call
    var loadShots = function(response) {
        // increase the page number
        DRIB.page++

        //start up or start back the scoll pagination
        // scrollPagination()
        DRIB.helper.trigger('pagination', 'on')

        console.log(response)
        var shots = response.shots
          , container = $('.shot-container .shots')
          , template = _.template( $('#shot-tpl').html() )
          , shotCollection = DRIB.collections.shotCollection
          , favoriteIdArray =  DRIB.collections.shotCollection.pluck('shotId')
          , imageQuality = localStorage.getItem('DRIB-setting-shotImage') || DRIB.shotImage
          , shotHeight = DRIB.shotHeight //make sure that the
          , rendered

        for (var i = 0; i < shots.length; i++) {

            //check to see if the shot is already favorited
            shots[i].favorited = false

            //check to see if the shot has categories
            shots[i].categories = false

            //grab the selected image quality from model
            shots[i].image = shots[i][imageQuality]

            //set the height of the shot based on the viewport and the choose grid size
            shots[i].shotHeight = shotHeight

            //check to see if its fav'd
            if( _.contains( favoriteIdArray, shots[i].id) ){
                shots[i].favorited = true
            }

            //check to see if shot is favorited then if it has categories
            if( shotCollection.findWhere({shotId: shots[i].id}) ){
                if( shotCollection.findWhere({shotId: shots[i].id}).attributes.categories.length > 0 ){
                    shots[i].categories = true
                }
            }

            rendered = template( shots[i] )

            // add shot to cache for favorite adding
            DRIB.shotCache.push( shots[i] )

            //im lazy...
            //create method to load all to string then append
            container.append(rendered)
        };
        DRIB.helper.trigger('lazyload')
    }

    //ajax call to drab the shots from dribble api
    var grabShots = function(){
        //kill the pagination just in case its currently running, so scroll events
        //won't double up
        DRIB.helper.trigger('pagination', 'off')

        DRIB.helper.trigger('loading', 'on')
        $.ajax({
            url: "http://api.dribbble.com/shots/"+ DRIB.shotList +"?&page=" + DRIB.page,
            type: "get",
            cache: true,
            dataType: "jsonp",
            success: loadShots
        });
    }

    var clickToFavotite = function(el, event){
        // event.stopPropagation();
        // event.preventDefault();

        // condition for raw shot and for overlay
        var shotElement = typeof el.data === "undefined" ? $(this).parents('.shot') : el
          , searchedShot = shotElement.data('shotid')
          , returnedShot = _.find(DRIB.shotCache, function(shot){ return shot.id === searchedShot })
          , img = shotElement.find('.shot-image')
          , clonedImg = img.clone() //dup that image to do animations with css
          , currentShots = DRIB.collections.shotCollection.toJSON()
          , notFavorite = typeof _.find(currentShots, function(shot){ return shot.shotId === searchedShot }) === "undefined"

        shotElement.removeClass('unfavorited')

        console.log('Checking for: '+ searchedShot )
        console.log(returnedShot)

        var makeFavorite = function(){
            shotElement.addClass('cloning favorited')

            clonedImg.prependTo(shotElement).addClass('clone')

            clonedImg.bind('oanimationend animationend webkitAnimationEnd', function() {
               shotElement.removeClass('cloning').find('.clone').remove()
               clonedImg.off()//stop casper!!! (ghost event...)
            });

            console.log('favorite is not there')
            DRIB.helper.trigger('shot/create', returnedShot)
        }

        //check the current collection before adding to prevent duplication
        ////create pubsub and make handler for existing favorite
        ////make pubsub
         notFavorite ? makeFavorite()
                     : console.log('this shot is already a favorite')

        return false
    }

    var clickToUnfavorite = function(el){
        // condition for raw shot and for overlay
        var shotElement = typeof el.data === "undefined" ? $(this).parents('.shot') : el
          , searchedShot = shotElement.data('shotid')

        shotElement.removeClass('favorited').addClass('unfavorited')

        var model = DRIB.collections.shotCollection.findWhere({shotId: searchedShot})

        if (model === undefined){
            console.log('no such shot')
            return
        }else{
            model.destroy()
            console.log('removed ' + searchedShot)
        }

        return false
    }

    var clickToCategorize = function(){
        var shotElement = $(this).parents('.shot')
          , searchedShot = shotElement.data('shotid')

        var model = DRIB.collections.shotCollection.findWhere({shotId: searchedShot})

        DRIB.views.categoryModal = new CategoryModal({
              modelInfo:model
            , rawViewInfo:shotElement //send the el parent to change the el to unfavorite
        })

        return false
    }

    var clickForInfo = function( shotElement, searchedShot ){
        // var shotElement = el //native js el
        //   , searchedShot = shotElement.data('shotid')


        //if the grid is active show the modal opposed to moving the image
        if ($('.grid').length > 0) {
            console.log('launch the modal')
            //check to see if its in the shot cache, if its not check the favorites
            var info = _.findWhere(DRIB.shotCache, {id: searchedShot}) !== undefined
                ? _.findWhere(DRIB.shotCache, {id: searchedShot})
                :  _.findWhere(DRIB.collections.shotCollection.toJSON(), {shotId: searchedShot})

            DRIB.views.moreInfoModal = new MoreInfoModal({ shotInfo: info })
        } else {
            shotElement[0].classList.toggle('more-info')
            shotElement.find('.shot-overlay-choice').off()
        }
    }

    var clickForOverlay = function(e, viewElement ) {
        //check to see if an el was passed from view first or was from raw shot
        var el = viewElement || $(this)
          , shotElement = el.parents('.shot')
          , searchedShot = shotElement.data('shotid')
          , overlay = shotElement[0].querySelector('.shot-overlay')

        var showOverlay = function(){
            //add overlay
            shotElement[0].classList.add('active-overlay')

            //events for choices
            shotElement.find('.shot-overlay-choice').on('click', function(){
                var choice = $(this)[0].getAttribute('data-choice')

                //prevent ghosts
                shotElement.find('.shot-overlay-choice').off()

                //kill the overlay
                shotElement[0].classList.remove('active-overlay')

                //would need to pass the shotElement to the fav and more info methods
                if( choice === 'favorite' ){
                    clickToFavotite(shotElement, e)
                }else if(choice === 'unfavorite'){
                    clickToUnfavorite( shotElement )
                }else if(choice === 'info'){
                     clickForInfo( shotElement, searchedShot )
                }
            })
        }
        shotElement.hasClass('more-info') ? clickForInfo( shotElement )
                                          : showOverlay()

        //set timer to remove after 1 second if still there
        setTimeout(function() {
            shotElement[0].classList.remove('active-overlay')
        }, 1000);
    }

    var clearFavorites = function(){ // not working as it should...
        //for some reason it only deletes one?
        var shots = DRIB.collections.shotCollection.models

        for (var i = 0; i < shots.length; i++) {
            shots[i].destroy()
        };
    }

    var eventHandles = function(){//clean up, in extremely sloppy
        var container = $('.shot-container')

        //for when the grid is too small for the screen and the user isnt allowed to
        //scroll for the pagi to kick in
        $('.load-more').click(grabShots)

        // consider
        // var clickOrTouch = (('ontouchend' in window)) ? 'touchend' : 'click';
        // $('.shot').on(clickOrTouch, function() {
        //     // do something
        // });

        container.on('click', ".shot-image",      clickForOverlay)
                 .on('click', ".shot-favorite",   clickToFavotite)
                 .on('click', ".shot-unfavorite", clickToUnfavorite)
                 .on('click', ".shot-list",       clickToCategorize)
    }

    var loadDesktop = function(){
        console.log('desktop shit')

        $('html').addClass('desktop-landing-page')
    }

    var loadMobile =  function(){
        //no need for landing page markup
        //also its easier to have there its easier to have there and no show opposed to render (and seo shit)
        $('.landing-page').remove()

        App = new AppRouter()
        Backbone.history.start()

        //init the first shot grabbing
        grabShots()

        DRIB.helper.trigger('gridSize')

        eventHandles()
    }

    var init = function() {
        var tooWide = window.innerWidth > DRIB.deviceWidthLimit //where our media queries die
          , isDesktop = head.desktop

        //add isDesktop when in prod
        tooWide  ? loadDesktop() //landing page
                 : loadMobile() //application
    }

    $(document).ready(init)

    //public for helpers...
    return {
        grabShots: grabShots //this need to be exposed for helpers, consider just making a helper
    }

}())


// update the current shots
// _.each(DRIB.collections.shotCollection.models, function(shot){
//     var ID = shot.attributes.shotId

//     $.ajax({
//         url: "http://api.dribbble.com/shots/"+ID,
//         type: "get",
//         cache: true,
//         dataType: "jsonp",
//         success: function(data){
//             // shot.attributes.likes = data.likes_count
//             shot.attributes.comments = data.comments_count

//             shot.save()
//         }
//     });
// })
