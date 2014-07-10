/**
 * to show and remove page overlay and kill scrolling
 * @param  {[string]} condition [on or off]
 * @param  {[obj]}    view      [view obj passed for closing]
 * @param  {[string]} hide      [optional: tell the helper tp hide the view opposed to removing it]
 * @return {[event]}            [show overlay or remove overlay]
 */
DRIB.helper.on('overlay', function(condition, view, hide) {
    var body = $('body')
      , overlay = $('.overlay')
      , html = $('html')

    var removeOverlay = function(){
        var msg //msg to status of view
        //added remove modal because in most cases its launch with overlay
        overlay.remove() 

        if(hide && view){ //hide the view
            //remove the only two classes that could be in on the panel
            view.$el.removeClass('active edit-mode')
            msg = 'hiding view'
        }else if(view){//kill the view
            view.remove()
           msg ='removing view'
        }

        console.log('removed overlay and '+msg)
        //old method with scrolling issue
        // body.removeClass('overlay-open')// remove no scroll from html tag
       
        //enable scrolling
        var scrollTop = parseInt( html.css('top') );
        html[0].classList.remove('noscroll');
        $('html,body').scrollTop(-scrollTop);
    }

    if(condition === 'on'){//append overlay to body
        console.log('show overlay')
        //prevent scrolling while overlay
        //old method with scrolling issue
        // body.addClass('overlay-open').append('<div class="overlay"></div>')

        //disable scrolling
        //http://stackoverflow.com/a/13891717/240993
        body.append('<div class="overlay"></div>')
        if ( document.documentElement.scrollHeight > window.innerHeight ){
             var scrollTop = ( html.scrollTop()) ? html.scrollTop() : body.scrollTop(); // Works for Chrome, Firefox, IE...
            html[0].classList.add('noscroll')
            html[0].setAttribute('style','top:'+-scrollTop+'px');         
        }
    
        var overlay = $('.overlay')

        overlay[0].classList.add('active')

        overlay.on("click", function(){         
            removeOverlay()
           
            overlay.off("click") //remove that damn event!
        })
    }else{//remove overlay from dom
        removeOverlay()
    }
})

/**
 * Infinate pagination scolling thing
 * scoll to keep fetching new images as window reaches bottom of the page
 * @param  {[string]} state [on or off]
 * @return {[event]}       [start or stop the pagination]
 */
DRIB.helper.on('pagination', function(state) {
    //need to specify a specific class to the scroll so it won't interfere 
    //with other scroll events like the sticky header
    //http://stackoverflow.com/a/15106990/240993
    var scrollClass = '.paginationScrollClass'

    DRIB.helper.trigger('loading', 'off')

    var scollAnchorCheck = function(){
        var anchor = $(".shot-container .shot-anchor") //element of header

        var offset = window.innerHeight
          , top = $(window).scrollTop()
          , anchorPosition = ( anchor.offset().top - offset ) - 500
        if ( anchorPosition < top) {
            console.log('grabbing shots...')

            //wth, make this a helper... 
            DRIB_MODULE.grabShots()

            //needs to be after the grab shots!!
            //this will kill the scroll event to prevent overlapping loading
            $(window).unbind( scrollClass ) 
        } 
        // console.log(anchor.offset().top + offset - $(window).scrollTop())
    }
    if(state === 'on'){
        $(window).bind('scroll'+scrollClass, scollAnchorCheck)
    }else if(state === 'off'){
        $(window).unbind( scrollClass ) 
    }
})

/**
 * show list of shots that have the selected category
 * @param  {[string]} category [name of category, ex: TID]
 * @return {[event]}            [will replace the favorite shot container with matched shots to the category]
 */
DRIB.helper.on('category/show', function(category) {
    var viewingAll = category === 'view-all'

    console.log('Showing ' + category + 'category')
    DRIB.helper.trigger('pagination', 'off')

    $('.shot-container').hide()
    $('.favorite-container').addClass('active')

    var showAllFavorites = function(){
        DRIB.helper.trigger('notification', 'All Favorites', DRIB.collections.shotCollection.models.length)

        //reensure that the collection is the default collection with all models
        DRIB.collectionViews.shotCollectionView.collection = DRIB.collections.shotCollection
    }

    var showSpecificCategory = function(){
        var collection = DRIB.collections.shotCollection // grab the orig collection
          , arrayOfCategories = collection.pluck('categories') // grab all of models categories
          , arrayOfMatches = [] //array for matching models... duh

        for (var i = 0; i < arrayOfCategories.length; i++) {
            //check to see if it has a match to 'inspiration' which would be category
            if ( _.contains(arrayOfCategories[i], category)) {
                arrayOfMatches.push(collection.at(i))//map to the model in collection
            }
        };

        // make a new collection that will have all the models that has the cat
        var categorizedCollection = new Backbone.Collection(arrayOfMatches);

        // reuse the shotcollection view to render
        DRIB.collectionViews.shotCollectionView.collection = categorizedCollection

        //category is being show to help the notification/sidebar helpers (a helper to help helpers!!)
        DRIB.collectionViews.shotCollectionView.category = category

        //fire off the notification for the category
        DRIB.helper.trigger('notification', category, categorizedCollection.length)
    }

    //check for the view all link since it dont need to check the collection
    //and create a new collection like the categories
    viewingAll ? showAllFavorites()
               : showSpecificCategory()

    //re init to bind the new collection to the view so it can listen to changes to collection
    DRIB.collectionViews.shotCollectionView.initialize()
})

/**
 * Returns the main view to the main shots
 * @return {[type]} [description]
 */
DRIB.helper.on('category/hide', function() {
    DRIB.helper.trigger('pagination', 'on')
    $('.favorite-container').removeClass('active')//refactor to use view el
    //do more cleaning here for the shotCollectionView if perf takes a hit
    
    $('.shot-container').removeAttr('style') //refactor to use view el


    //remove the notification since there is no reason one should be there 
    //without a specific category being shown
    DRIB.helper.trigger('notification/remove')
})


/**
 * create a notification for categories being shown
 * @param  {[string]} title [name of category]
 * @param  {[intger]} count [optional: the count of the categories]
 * @return {[type]}         [show the notification with the title on home screen]
 */
DRIB.helper.on('notification', function( title, count ) {

    var template = _.template( $('#notification-tpl').html() )
      , rendered = template({title:title, count:count })
      , mainContainer = $('.main')
      , notification
      , closeButton

    //check for a current notification and remove it
    if( $('.notification') )  $('.notification').remove()


    // DRIB.views.headerView.$el.append( rendered )
    var headerReact = $( DRIB.views.headerView.el() )
    headerReact.append( rendered )

    //need to fix the padding on the main container to prevent the header
    //from cutting off the shots
    mainContainer.css('padding-top', headerReact.height()+30+'px')

    notification = $('.notification')
    closeButton = notification.find('.notification-close')

    var removeNotification = function(){
        closeButton.off('click')//kill event

        notification.remove() //kill el

        DRIB.helper.trigger('category/hide')//hide cat view

        mainContainer.removeAttr('style')
    }

    closeButton.on('click', removeNotification)
})

/**
 * remove the notification
 * @return {[event]}      [will remove notification from the dom along with the events]
 */
DRIB.helper.on('notification/remove', function() {
    var notification = $('.notification')
      , mainContainer = $('.main')

    closeButton = notification.find('.notification-close').off('click')//kill event
    notification.remove() //kill el
    mainContainer.removeAttr('style')
})

/**
 * update the count in the notification, incase a shot it remvoed
 * @param  {[intger]} count [optional: the count of the categories]
 * @return {[event]}        [will update the count number in the notif]
 */
DRIB.helper.on('notification/update/count', function( count ) {

    //maybe make an animation to show change
    $('.notification-category-count').text(count)
})

/**
 * update the name in the notification, incase a shot it remvoed
 * @param  {[intger]} name [optional: the name of the categories]
 * @return {[event]}        [will update the name in the notif]
 */
DRIB.helper.on('notification/update/name', function( name ) {

    //maybe make an animation to show change
    $('.notification-category').text(name)
})


/**
 * adds the shot to favorites
 * @param  {[intger]} count [optional: the count of the categories]
 * @return {[event]}        [will update the count number in the notif]
 */
DRIB.helper.on('shot/create', function( returnedShot ) {
    DRIB.collections.shotCollection.create({
        "shotId": returnedShot.id
      , "image_url": returnedShot.image_url 
      , "image_teaser_url": returnedShot.image_teaser_url 
      , "title": returnedShot.title
      , "short_url": returnedShot.short_url
      , "likes": returnedShot.likes_count
      , "views": returnedShot.views_count
      , "author": returnedShot.player.name
      , "comments": returnedShot.comments_count
    })
})

/**
 * toggle loading icon
 * @param  {[string]} status [on of off]
 * @return {[event]}        show of hide the loading icon
 */
DRIB.helper.on('loading', function( status ) {
    if(status === 'on'){
        document.getElementsByClassName('loading')[0].classList.add('active')

        document.getElementsByClassName('load-more')[0].classList.add('hide')
    }else if(status === 'off'){
        document.getElementsByClassName('loading')[0].classList.remove('active')

        document.getElementsByClassName('load-more')[0].classList.remove('hide')
    }
})

/**
 * Lazy loading for images
 * @return {[event]} [new pagination load will be lazy loaded]
 */
DRIB.helper.on('lazyload', function(){
    //orig: http://css-tricks.com/snippets/javascript/lazy-loading-images/
    //modified for use of css opposed to images and re-factored 
    var $q = function(q, res) {
        if (document.querySelectorAll) {
            res = document.querySelectorAll(q);
        } else {
            var d = document,
                a = d.styleSheets[0] || d.createStyleSheet();
            a.addRule(q, 'f:b');
            for (var l = d.all, b = 0, c = [], f = l.length; b < f; b++)
                l[b].currentStyle.f && c.push(l[b]);

            a.removeRule(0);
            res = c;
        }
        return res;
    } 

    var addEventListener = function(evt, fn) {
        window.addEventListener ? this.addEventListener(evt, fn, false) 
                                : (window.attachEvent) 
                                    ? this.attachEvent('on' + evt, fn) 
                                    : this['on' + evt] = fn;
    }
    //var _has = function(obj, key) {
    //     return Object.prototype.hasOwnProperty.call(obj, key);
    // };

    var loadImage = function (el, fn) {
        var src = el.getAttribute('data-src');
        el.setAttribute("style", "background-image:url(" + src + ");" )

        //to stop the animation and prevent unnecessary events
        el.classList.remove('lazy')
    }

    var elementInViewport = function (el) {
        var rect = el.getBoundingClientRect()

        return (
            rect.top >= 0 && rect.left >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight)
        )
    }

    var images = new Array()

    var query = $q('.lazy')

    var processScroll = function() {
        for (var i = 0; i < images.length; i++) {
            if (elementInViewport(images[i])) {
                loadImage(images[i], function() {
                    images.splice(i, i);
                });
            }
        };
    };

    // Array.prototype.slice.call is not callable under our lovely IE8 
    for (var i = 0; i < query.length; i++) {
        images.push(query[i]);
    };

    processScroll();
    addEventListener('scroll', processScroll);
})

/** 
 * Dribbble api filter change
 * @param  {[string]} data [everyone, debuts, popular]
 * @return {[type]}      [clear raw shots, load new and move viewport to top]
 */
DRIB.helper.on('shots/filtered', function( data ) {
    //will be turned back on after shotGrabbing, naturally
    //if left on, scroll events will double up
    DRIB.helper.trigger('pagination', 'off')

    //need to clear the cache since its only based on the currently displayed shots
    DRIB.shotCache = []

    //move to top of page to prevent lazyload and pagi from going nuts
    //while the overlay is active, it sets window to fixed and moves the page
    //to adjust to the last position, no need since we want to go back to the top
    $('html').attr('style', "")

    $('.shot-container .shots').html("")//clear the current raw shots

    DRIB.shotList = data//set new data
    DRIB.page = 1//reset page count

    localStorage.setItem('DRIB-setting-shotlist', data)

    DRIB_MODULE.grabShots()
})

/**
 * Change the grid size
 * @param  {[integer]} size [optional: should be 1, 2 or 3 ]
 * @return {[type]}      [will add classes to body for for grid and change the dynamic shot height]
 */
DRIB.helper.on('gridSize', function( size ){
    //on initial load will grab the default ( 1 grid ) if no specific size is specified  
    var gridSize = size || DRIB.shotGrid
      , body = $('body')
      , height
      , shotContainer = $('.shot-image-container')

    //height should he 75% of the width of the shot container
    height = Math.floor(.75 * (.91 * window.innerWidth / gridSize ) )

    //sloppy, refactor when sober
    if( gridSize === 1 ){
        body.removeClass('grid grid2 grid3')
    }else if( gridSize === 2 ){
        //remove old class
        $('.more-info').removeClass('more-info') //wetness
        body.removeClass('grid3')
        body.addClass('grid grid2')
    }else if( gridSize === 3 ){
        //remove old class
        $('.more-info').removeClass('more-info') //wetness
        body.removeClass('grid2')
        body.addClass('grid grid3')
    }

    //go through all of the shots and change the height
    //this fixes the issue when you change grid, the height from the previous grid size is there
    for (var i = 0; i < shotContainer.length; i++) {
        shotContainer[i].style.height = height+'px'
    };

    DRIB.shotHeight = height+'px'
})

/**
 * clears all settings, shots and categories
 */
DRIB.helper.on('clearStorage', function(){
    var choice = confirm("You sure about this?? \n It your favorites, categories and settings...")
      , doubleConfirm = choice ? confirm("Alright then, click OK and its all gone.") : console.log('not cleared...')

    if(doubleConfirm){
        console.log('cleared')
        localStorage.getItem('DRIB-setting-shotlist')
        localStorage.getItem('DRIB-setting-shotImage')
        localStorage.getItem('DRIB-setting-shotGrid')

        // will call destroy for every... single... model...
        _.invoke(DRIB.collections.shotCollection.toArray(), 'destroy');
        _.invoke(DRIB.collections.categoryCollection.toArray(), 'destroy');
    }else{
        console.log('not cleared...')
    }

})


//global helper, why don't JS have a native clone??
function clone(obj) {
    if (obj == null || typeof(obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for (var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

//experiment
DRIB.helper.clickevent = head.desktop ? 'click' : 'touchstart'