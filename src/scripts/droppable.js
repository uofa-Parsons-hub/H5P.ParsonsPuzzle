H5P.TextDroppable = (function ($) {
  //CSS Main Containers:
  //Special Sub-containers:
  var SHOW_SOLUTION_CONTAINER = "h5p-drag-show-solution-container";

  //CSS Dropzone feedback:
  var CORRECT_FEEDBACK = 'h5p-drag-correct-feedback';
  var WRONG_FEEDBACK = 'h5p-drag-wrong-feedback';

  //CSS Draggable feedback:
  var DRAGGABLE_FEEDBACK_CORRECT = 'h5p-drag-draggable-correct';
  var DRAGGABLE_FEEDBACK_WRONG = 'h5p-drag-draggable-wrong';

  /**
   * Private class for keeping track of droppable zones.
   * @private
   *
   * @param {String} text Correct text string for this drop box.
   * @param {number} indent the current level of indentation
   * @param {number} newLeft new css left value for setting changed layout
   * @param {undefined/String} tip Tip for this container, optional.
   * @param {jQuery} dropzone Dropzone object.
   * @param {jQuery} dropzoneContainer Container Container for the dropzone.
   * @param {number} index.
   * @param {Object} params Behavior settings
   */
  function Droppable(solution, tip, correctFeedback, incorrectFeedback, dropzone, dropzoneContainer, index, params) {
    var self = this;
    self.text = solution.code;
    self.solution = solution;
    self.indent = 0;
    self.indentSpaces = 4;
    self.newLeft = 0xffffffff;
    self.tip = tip;
    self.correctFeedback = correctFeedback;
    self.incorrectFeedback = incorrectFeedback;
    self.index = index;
    self.params = params;
    if (self.params.indentBy2) {
      self.indentSpaces = 2;
    }
    /**
     * @type {H5P.TextDraggable}
     */
    self.containedDraggable = null;
    self.lastContainedDraggable = null;
    self.$dropzone = $(dropzone);
    self.$dropzoneContainer = $(dropzoneContainer);

    if (self.tip) {
      self.$tip = H5P.JoubelUI.createTip(self.tip, {
        tipLabel: self.params.tipLabel,
        tabcontrol: true
      });
      self.$dropzoneContainer.append(self.$tip);

      // toggle tabindex on tip, based on dropzone focus
      self.$dropzone.focus(() => self.$tip.attr('tabindex', '0'));
      self.$dropzone.blur(() => self.removeTipTabIndexIfNoFocus());
      self.$tip.blur(() => self.removeTipTabIndexIfNoFocus());
    }

    self.$incorrectText = $('<div/>', {
      html: self.params.incorrectText + " " + self.params.correctAnswer,
      'class': 'correct-answer'
    });

    self.$correctText = $('<div/>', {
      html: self.params.correctText,
      'class': 'correct-answer'
    });

    self.$showSolution = $('<div/>', {
      'class': SHOW_SOLUTION_CONTAINER
    }).appendTo(self.$dropzoneContainer).hide();
  }

  Droppable.prototype.removeTipTabIndexIfNoFocus = function () {
    const self = this;

    setTimeout(() => {
      if(!self.$dropzone.is(':focus') && !self.$tip.is(':focus')){
        self.$tip.attr('tabindex', '-1');
      }
    }, 0);
  };

  /**
   * Displays the solution next to the drop box if it is not correct.
   */
  Droppable.prototype.showSolution = function () {
    const correct = this.isCorrect();
    if (!correct) {
      this.$showSolution.html(this.solution.htmlIndent());
      this.$dropzone.css('padding-left',0);
      this.$dropzone.hide();
      this.$showSolution.css('padding-left',0);
      this.$showSolution.css('margin-left',0);
    }

    this.$showSolution.prepend(correct ? this.$correctText : this.$incorrectText);
    this.$showSolution.toggleClass('incorrect', !correct);
    this.$showSolution.show();
  };

  /**
   * Hides the solution.
   */
  Droppable.prototype.hideSolution = function () {
    this.$showSolution.html('');
    this.$showSolution.hide();
  };

  /**
   * Returns the html element
   *
   * @return {HTMLElement}
   */
  Droppable.prototype.getElement = function () {
    return this.$dropzone.get(0);
  };

  /**
   * Appends the droppable to the provided container.
   *
   * @param {jQuery} $container Container which the dropzone will be appended to.
   */
  Droppable.prototype.appendDroppableTo = function ($container) {
    this.$dropzoneContainer.appendTo($container);
  };
  /**
   * Appends the draggable contained within this dropzone to the argument.
   * Returns the Draggable that was reverted, if any exists
   *
   * @param {jQuery} $container Container which the draggable will append to.
   *
   * @return {Draggable}
   */
  Droppable.prototype.appendInsideDroppableTo = function ($container) {
    if (this.containedDraggable !== null) {
      this.containedDraggable.revertDraggableTo($container);
      return this.containedDraggable;
    }
  };

  /**
   * Sets the contained draggable in this drop box to the provided argument.
   *
   * @param {Draggable} droppedDraggable A draggable that has been dropped on this box.
   */
  Droppable.prototype.setDraggable = function (droppedDraggable) {

    var self = this;
    self.newLeft = droppedDraggable.getDraggableElement().offset().left;

    // if there is already a different element in the dropzone remove it
    if (self.containedDraggable !== null) {
      self.lastContainedDraggable = self.containedDraggable;
      self.containedDraggable.removeFromZone();
    }

    // dropzone is empty - add the new element
    self.containedDraggable = droppedDraggable;
    droppedDraggable.addToZone(self);
    self.layout();

  };

  /**
   * Returns true if this dropzone currently has a draggable
   *
   * @return {boolean}
   */
  Droppable.prototype.hasDraggable = function () {
    return !!this.containedDraggable;
  };

  /**
   * Removes the contained draggable in this box.
   */
  Droppable.prototype.removeDraggable = function () {
    if (this.containedDraggable !== null) {
      this.lastContainedDraggable = this.containedDraggable;
      this.containedDraggable = null;
      this.newLeft = 0xffffffff;
      this.indent = 0;
    }
    this.$dropzone.css('padding-left',"");
    this.$showSolution.css('padding-left',"");
    this.$showSolution.css('margin-left',"");
    this.$dropzone.show();
  };

  /**
   * Checks if this drop box contains the correct draggable.
   *
   * @returns {Boolean} True if this box has the correct answer.
   */
  Droppable.prototype.isCorrect = function () {
    if (this.containedDraggable === null) {
      return false;
    }
    var solution = this.solution;
    var answerIndentation = solution.indent;
    return solution.code === this.text && answerIndentation == this.indent;
  };


  Droppable.prototype.layout = function() {
    if( this.newLeft != 0xffffffff) {
console.log('new left: ' + this.newLeft);
console.log('current indent: ' + (this.indent * this.indentSpaces))
      this.containedDraggable.getDraggableElement().css('left',(this.indent * this.indentSpaces)  + 'ch');
console.log('current offset: ' + this.containedDraggable.getDraggableElement().offset().left)

      while (this.newLeft > this.containedDraggable.getDraggableElement().offset().left) {   
     // } && this.containedDraggable.getDraggableElement().offset().right > this.$dropzoneContainer.offset().right){
        this.shiftRight();
      }
      while (this.newLeft < this.containedDraggable.getDraggableElement().offset().left &&
             this.containedDraggable.getDraggableElement().offset().left > this.$dropzoneContainer.offset().left) {
        this.shiftLeft();
      }
      this.newLeft = 0xffffffff;
    }
  }

/*
  Droppable.prototype.shiftTo = function(pos) {
    this.indent = parseInt(pos / 7);
    console.log('indentation level:')
    pos = this.indent;
    console.log(pos);
    if( pos >= 0 ) {
      this.containedDraggable.getDraggableElement().css("left", pos.toString() + "em");
    }
  }
  */

  Droppable.prototype.shiftLeft = function() {
    if( this.indent >= 1 ){
      this.indent = this.indent - 1;
console.log('shifting left to ' + (this.indent * this.indentSpaces));
    this.containedDraggable.getDraggableElement().css('left',(this.indent * this.indentSpaces) + 'ch');
    }
  }

  Droppable.prototype.shiftRight = function() {
    this.indent = this.indent + 1;
  console.log('shifting draggable to ' + (this.indent * this.indentSpaces));
    // this.$dropzone.css('left',this.indent * space + 'ch');
    this.containedDraggable.getDraggableElement().css('left',(this.indent * this.indentSpaces) + 'ch');
  }
  /**
   * Sets CSS styling feedback for this drop box.
   */
  Droppable.prototype.addFeedback = function () {
    //Draggable is correct
    if (this.isCorrect()) {
      this.$dropzone.removeClass(WRONG_FEEDBACK).addClass(CORRECT_FEEDBACK);

      //Draggable feedback
      this.containedDraggable.getDraggableElement().removeClass(DRAGGABLE_FEEDBACK_WRONG).addClass(DRAGGABLE_FEEDBACK_CORRECT);
    }
    else if (this.containedDraggable === null) {
      //Does not contain a draggable
      this.$dropzone.removeClass(WRONG_FEEDBACK).removeClass(CORRECT_FEEDBACK);
    }
    else {
      //Draggable is wrong
      this.$dropzone.removeClass(CORRECT_FEEDBACK).addClass(WRONG_FEEDBACK);

      //Draggable feedback
      if (this.containedDraggable !== null) {
        this.containedDraggable.getDraggableElement().addClass(DRAGGABLE_FEEDBACK_WRONG).removeClass(DRAGGABLE_FEEDBACK_CORRECT);
      }
    }
  };

  /**
   * Removes all CSS styling feedback for this drop  *  * box.
   */
  Droppable.prototype.removeFeedback = function () {
    this.$dropzone.removeClass(WRONG_FEEDBACK).removeClass(CORRECT_FEEDBACK);

    //Draggable feedback
    if (this.containedDraggable !== null) {
      this.containedDraggable.getDraggableElement().removeClass(DRAGGABLE_FEEDBACK_WRONG).removeClass(DRAGGABLE_FEEDBACK_CORRECT);
    }
  };

  /**
   * Returns true if the dropzone has visible feedback
   */
  Droppable.prototype.hasFeedback = function () {
    return this.$dropzone.hasClass(WRONG_FEEDBACK) || this.$dropzone.hasClass(CORRECT_FEEDBACK);
  };

  /**
   * Sets short format of draggable when inside a dropbox.
   */
  Droppable.prototype.setShortFormat = function () {
    if (this.containedDraggable !== null) {
      this.containedDraggable.setShortFormat();
    }
  };

  /**
   * Disables dropzone and the contained draggable.
   */
  Droppable.prototype.disableDropzoneAndContainedDraggable = function () {
    if (this.containedDraggable !== null) {
      this.containedDraggable.disableDraggable();
    }
    this.$dropzone.droppable({ disabled: true});
  };

  /**
   * Enable dropzone.
   */
  Droppable.prototype.enableDropzone = function () {
    this.$dropzone.droppable({ disabled: false});
  };

  /**
   * Removes the short format of draggable when it is outside a dropbox.
   */
  Droppable.prototype.removeShortFormat = function () {
    if (this.containedDraggable !== null) {
      this.containedDraggable.removeShortFormat();
    }
  };

  /**
   * Gets this object's dropzone jQuery object.
   *
   * @returns {jQuery} This object's dropzone.
   */
  Droppable.prototype.getDropzone = function () {
    return this.$dropzone;
  };

  /**
   * Return the unique index of the dropzone
   *
   * @returns {number}
   */
  Droppable.prototype.getIndex = function () {
    return this.index;
  };

  return Droppable;
})(H5P.jQuery);

export default H5P.TextDroppable;
