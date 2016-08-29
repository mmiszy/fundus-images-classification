'use strict';

import * as classificationController from './classification.controller.js';
import * as classificationValidation from './classification.validation.js';

export const routes = [
    {
        method: 'POST',
        path: '/classification',
        config: {
            tags: ['api'],
            handler: classificationController.handleCommand,
            validate: classificationValidation.classification
        }
    }
];
