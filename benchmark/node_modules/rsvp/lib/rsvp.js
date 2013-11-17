import { EventTarget } from "./rsvp/events";
import { Promise } from "./rsvp/promise";
import { denodeify } from "./rsvp/node";
import { all } from "./rsvp/all";
import { hash } from "./rsvp/hash";
import { rethrow } from "./rsvp/rethrow";
import { defer } from "./rsvp/defer";
import { config } from "./rsvp/config";
import { resolve } from "./rsvp/resolve";
import { reject } from "./rsvp/reject";

function configure(name, value) {
  config[name] = value;
}

export { Promise, EventTarget, all, hash, rethrow, defer, denodeify, configure, resolve, reject };
