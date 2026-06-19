"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContextMiddleware = exports.RequestContext = void 0;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
const storage = new async_hooks_1.AsyncLocalStorage();
exports.RequestContext = {
    run(data, fn) {
        return storage.run(data, fn);
    },
    get() {
        return storage.getStore();
    },
};
let RequestContextMiddleware = class RequestContextMiddleware {
    use(req, res, next) {
        exports.RequestContext.run({
            actorRole: req.headers['x-arms-role'] || undefined,
            actorUsername: req.headers['x-actor-username'] || undefined,
            clientIp: req.headers['x-client-ip'] || undefined,
        }, () => next());
    }
};
exports.RequestContextMiddleware = RequestContextMiddleware;
exports.RequestContextMiddleware = RequestContextMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestContextMiddleware);
//# sourceMappingURL=request-context.js.map