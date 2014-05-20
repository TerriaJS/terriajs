/**
 * Cesium - https://github.com/AnalyticalGraphicsInc/cesium
 *
 * Copyright 2011-2014 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md for full licensing details.
 */
(function () {
/*global define*/
define('Core/defined',[],function() {
    "use strict";

    /**
     * Returns true if the object is defined, returns false otherwise.
     *
     * @exports defined
     *
     * @example
     * if (Cesium.defined(positions)) {
     *      doSomething();
     * } else {
     *      doSomethingElse();
     * }
     */
    var defined = function(value) {
        return value !== undefined;
    };

    return defined;
});

/*global define*/
define('Workers/taskDispatcher',[
        'require',
        '../Core/defined'
    ], function(
        require,
        defined) {
    "use strict";

    var taskWorkerCache = {};

    /**
     * A worker that delegates tasks from a TaskProcessor to other workers by
     * inspecting the parameters for a "task" property, which is expected to be
     * the module ID of another worker.  This worker will load that worker, if not
     * already loaded, then pass the event to that worker.
     *
     * @exports taskDispatcher
     *
     * @see TaskProcessor
     * @see <a href='http://www.w3.org/TR/workers/'>Web Workers</a>
     * @see <a href='http://www.w3.org/TR/html5/common-dom-interfaces.html#transferable-objects'>Transferable objects</a>
     */
    var taskDispatcher = function(event) {
        var taskWorkerName = event.data.parameters.task;
        var taskWorker = taskWorkerCache[taskWorkerName];
        if (defined(taskWorker)) {
            taskWorker(event);
        } else {
            require(['./' + taskWorkerName], function(taskWorker) {
                taskWorkerCache[taskWorkerName] = taskWorker;
                taskWorker(event);
            });
        }
    };

    return taskDispatcher;
});
}());