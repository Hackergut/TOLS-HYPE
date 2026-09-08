import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as GROK_PROVIDERS } from "./server-C9h8EWfT.mjs";
import { t as Input } from "./input-HW-MdT1M.mjs";
import { t as TolsMark } from "./tols-mark-D9pVfDGe.mjs";
import { r as signIn, t as authClient } from "./client-CVqXY6bk.mjs";
import { t as Label$1 } from "./label-BLXCKpH1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-D10wnPVP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const [mode, setMode] = (0, import_react.useState)("in");
	const [error, setError] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	async function onEmail(e) {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);
		const email = String(fd.get("email") ?? "");
		const password = String(fd.get("password") ?? "");
		const name = String(fd.get("name") ?? "Player");
		setPending(true);
		try {
			if (mode === "up") {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name
				});
				if (err) throw new Error(err.message);
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password
				});
				if (err) throw new Error(err.message);
			}
			window.location.href = "/";
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign-in failed");
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-2xl bg-card/90 p-6 shadow-[var(--shadow-glow)] backdrop-blur-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TolsMark, { large: true }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-heading mt-3 text-2xl font-semibold tracking-tight",
					children: mode === "in" ? "Sign in" : "Create account"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Google, X, or email. Play-money balances mint on first visit."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 space-y-3",
					children: [
						GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "outline",
							className: "h-11 w-full",
							onClick: () => void signIn(p.providerId, { callbackURL: "/" }),
							children: ["Continue with ", p.label]
						}, p.providerId)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative py-2 text-center text-xs text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "bg-card px-2",
								children: "or email"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "grid gap-3",
							onSubmit: (e) => void onEmail(e),
							children: [
								mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
										htmlFor: "name",
										children: "Name"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "name",
										name: "name",
										className: "h-11",
										required: true
									})]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
										htmlFor: "email",
										children: "Email"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "email",
										name: "email",
										type: "email",
										className: "h-11",
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
										htmlFor: "password",
										children: "Password"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "password",
										name: "password",
										type: "password",
										className: "h-11",
										required: true,
										minLength: 8
									})]
								}),
								error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-destructive",
									children: error
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "h-11",
									disabled: pending,
									children: mode === "in" ? "Sign in" : "Create account"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "w-full text-center text-sm text-muted-foreground hover:text-foreground",
							onClick: () => setMode(mode === "in" ? "up" : "in"),
							children: mode === "in" ? "Need an account?" : "Already registered?"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-center text-xs text-muted-foreground",
					children: [
						"By continuing you agree to the",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/terms",
							className: "text-foreground underline-offset-2 hover:underline",
							children: "Terms of Service"
						}),
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-4 block text-center text-sm text-muted-foreground hover:text-foreground",
					children: "Back to lobby"
				})
			]
		})
	});
}
//#endregion
export { Login as component };
