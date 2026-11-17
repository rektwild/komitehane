import assert from "node:assert/strict";
import test from "node:test";

import en from "../messages/en.json" with {type: "json"};
import tr from "../messages/tr.json" with {type: "json"};

import {routing} from "@/i18n/routing";
import {
  SHOW_PUBLIC_AUTH_ENTRY,
  publicAuthEntryLinks,
  visiblePublicAuthEntryLinks,
} from "@/lib/auth-entry";

test("hides public auth entry buttons until auth launches", () => {
  assert.equal(SHOW_PUBLIC_AUTH_ENTRY, false);
  assert.deepEqual(visiblePublicAuthEntryLinks(), []);
});

test("restores the same login and signup destinations when the gate is on", () => {
  assert.deepEqual(visiblePublicAuthEntryLinks(true), [
    {href: "/login", labelKey: "login"},
    {href: "/signup", labelKey: "signup"},
  ]);
  assert.deepEqual(visiblePublicAuthEntryLinks(false), []);
  assert.deepEqual(publicAuthEntryLinks, visiblePublicAuthEntryLinks(true));
});

test("keeps auth routes and header translations for later", () => {
  assert.deepEqual(routing.pathnames["/login"], {tr: "/giris", en: "/login"});
  assert.deepEqual(routing.pathnames["/signup"], {tr: "/kayit", en: "/signup"});
  assert.deepEqual(en.Header.auth, {login: "Log in", signup: "Sign up"});
  assert.deepEqual(tr.Header.auth, {login: "Giriş Yap", signup: "Kayıt Ol"});
});
