window.__ModuleLoader__.load({
	id: "@guowenzhang/dsh-drawio",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region node_modules/@deepseek-ai/dsh-util-workspace-path/lib/index.js
		/**
		* Split a path for display: the directories through their last separator, and
		* the final segment after it. Both `/` and `\` separate, so a Windows path
		* splits where its own segments end; trailing separators are dropped first, so
		* a directory path names its own last segment. A path with no separator, or a
		* separator-only path, is all name.
		* @param path - file or directory path using POSIX or Windows separators.
		* @returns the directory prefix (possibly empty) and the final segment.
		*/
		function pathPartsOf(path) {
			const trimmed = path.replace(/[/\\]+$/, "");
			if (trimmed === "") return {
				directory: "",
				name: path
			};
			const cut = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\")) + 1;
			return {
				directory: trimmed.slice(0, cut),
				name: trimmed.slice(cut)
			};
		}
		//#endregion
		//#region node_modules/fflate/esm/browser.js
		var u8 = Uint8Array;
		var u16 = Uint16Array;
		var i32 = Int32Array;
		var fleb = new u8([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			1,
			1,
			1,
			2,
			2,
			2,
			2,
			3,
			3,
			3,
			3,
			4,
			4,
			4,
			4,
			5,
			5,
			5,
			5,
			0,
			0,
			0,
			0
		]);
		var fdeb = new u8([
			0,
			0,
			0,
			0,
			1,
			1,
			2,
			2,
			3,
			3,
			4,
			4,
			5,
			5,
			6,
			6,
			7,
			7,
			8,
			8,
			9,
			9,
			10,
			10,
			11,
			11,
			12,
			12,
			13,
			13,
			0,
			0
		]);
		var clim = new u8([
			16,
			17,
			18,
			0,
			8,
			7,
			9,
			6,
			10,
			5,
			11,
			4,
			12,
			3,
			13,
			2,
			14,
			1,
			15
		]);
		var freb = function(eb, start) {
			var b = new u16(31);
			for (var i = 0; i < 31; ++i) b[i] = start += 1 << eb[i - 1];
			var r = new i32(b[30]);
			for (var i = 1; i < 30; ++i) for (var j = b[i]; j < b[i + 1]; ++j) r[j] = j - b[i] << 5 | i;
			return {
				b,
				r
			};
		};
		var _a = freb(fleb, 2);
		var fl = _a.b;
		var revfl = _a.r;
		fl[28] = 258, revfl[258] = 28;
		var _b = freb(fdeb, 0);
		var fd = _b.b;
		_b.r;
		var rev = new u16(32768);
		for (var i = 0; i < 32768; ++i) {
			var x = (i & 43690) >> 1 | (i & 21845) << 1;
			x = (x & 52428) >> 2 | (x & 13107) << 2;
			x = (x & 61680) >> 4 | (x & 3855) << 4;
			rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
		}
		var hMap = (function(cd, mb, r) {
			var s = cd.length;
			var i = 0;
			var l = new u16(mb);
			for (; i < s; ++i) if (cd[i]) ++l[cd[i] - 1];
			var le = new u16(mb);
			for (i = 1; i < mb; ++i) le[i] = le[i - 1] + l[i - 1] << 1;
			var co;
			if (r) {
				co = new u16(1 << mb);
				var rvb = 15 - mb;
				for (i = 0; i < s; ++i) if (cd[i]) {
					var sv = i << 4 | cd[i];
					var r_1 = mb - cd[i];
					var v = le[cd[i] - 1]++ << r_1;
					for (var m = v | (1 << r_1) - 1; v <= m; ++v) co[rev[v] >> rvb] = sv;
				}
			} else {
				co = new u16(s);
				for (i = 0; i < s; ++i) if (cd[i]) co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
			}
			return co;
		});
		var flt = new u8(288);
		for (var i = 0; i < 144; ++i) flt[i] = 8;
		for (var i = 144; i < 256; ++i) flt[i] = 9;
		for (var i = 256; i < 280; ++i) flt[i] = 7;
		for (var i = 280; i < 288; ++i) flt[i] = 8;
		var fdt = new u8(32);
		for (var i = 0; i < 32; ++i) fdt[i] = 5;
		var flrm = /*#__PURE__*/ hMap(flt, 9, 1);
		var fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
		var max = function(a) {
			var m = a[0];
			for (var i = 1; i < a.length; ++i) if (a[i] > m) m = a[i];
			return m;
		};
		var bits = function(d, p, m) {
			var o = p / 8 | 0;
			return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
		};
		var bits16 = function(d, p) {
			var o = p / 8 | 0;
			return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
		};
		var shft = function(p) {
			return (p + 7) / 8 | 0;
		};
		var slc = function(v, s, e) {
			if (s == null || s < 0) s = 0;
			if (e == null || e > v.length) e = v.length;
			return new u8(v.subarray(s, e));
		};
		var ec = [
			"unexpected EOF",
			"invalid block type",
			"invalid length/literal",
			"invalid distance",
			"stream finished",
			"no stream handler",
			,
			"no callback",
			"invalid UTF-8 data",
			"extra field too long",
			"date not in range 1980-2099",
			"filename too long",
			"stream finishing",
			"invalid zip data"
		];
		var err = function(ind, msg, nt) {
			var e = new Error(msg || ec[ind]);
			e.code = ind;
			if (Error.captureStackTrace) Error.captureStackTrace(e, err);
			if (!nt) throw e;
			return e;
		};
		var inflt = function(dat, st, buf, dict) {
			var sl = dat.length, dl = dict ? dict.length : 0;
			if (!sl || st.f && !st.l) return buf || new u8(0);
			var noBuf = !buf;
			var resize = noBuf || st.i != 2;
			var noSt = st.i;
			if (noBuf) buf = new u8(sl * 3);
			var cbuf = function(l) {
				var bl = buf.length;
				if (l > bl) {
					var nbuf = new u8(Math.max(bl * 2, l));
					nbuf.set(buf);
					buf = nbuf;
				}
			};
			var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
			var tbts = sl * 8;
			do {
				if (!lm) {
					final = bits(dat, pos, 1);
					var type = bits(dat, pos + 1, 3);
					pos += 3;
					if (!type) {
						var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
						if (t > sl) {
							if (noSt) err(0);
							break;
						}
						if (resize) cbuf(bt + l);
						buf.set(dat.subarray(s, t), bt);
						st.b = bt += l, st.p = pos = t * 8, st.f = final;
						continue;
					} else if (type == 1) lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
					else if (type == 2) {
						var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
						var tl = hLit + bits(dat, pos + 5, 31) + 1;
						pos += 14;
						var ldt = new u8(tl);
						var clt = new u8(19);
						for (var i = 0; i < hcLen; ++i) clt[clim[i]] = bits(dat, pos + i * 3, 7);
						pos += hcLen * 3;
						var clb = max(clt), clbmsk = (1 << clb) - 1;
						var clm = hMap(clt, clb, 1);
						for (var i = 0; i < tl;) {
							var r = clm[bits(dat, pos, clbmsk)];
							pos += r & 15;
							var s = r >> 4;
							if (s < 16) ldt[i++] = s;
							else {
								var c = 0, n = 0;
								if (s == 16) n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
								else if (s == 17) n = 3 + bits(dat, pos, 7), pos += 3;
								else if (s == 18) n = 11 + bits(dat, pos, 127), pos += 7;
								while (n--) ldt[i++] = c;
							}
						}
						var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
						lbt = max(lt);
						dbt = max(dt);
						lm = hMap(lt, lbt, 1);
						dm = hMap(dt, dbt, 1);
					} else err(1);
					if (pos > tbts) {
						if (noSt) err(0);
						break;
					}
				}
				if (resize) cbuf(bt + 131072);
				var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
				var lpos = pos;
				for (;; lpos = pos) {
					var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
					pos += c & 15;
					if (pos > tbts) {
						if (noSt) err(0);
						break;
					}
					if (!c) err(2);
					if (sym < 256) buf[bt++] = sym;
					else if (sym == 256) {
						lpos = pos, lm = null;
						break;
					} else {
						var add = sym - 254;
						if (sym > 264) {
							var i = sym - 257, b = fleb[i];
							add = bits(dat, pos, (1 << b) - 1) + fl[i];
							pos += b;
						}
						var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
						if (!d) err(3);
						pos += d & 15;
						var dt = fd[dsym];
						if (dsym > 3) {
							var b = fdeb[dsym];
							dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
						}
						if (pos > tbts) {
							if (noSt) err(0);
							break;
						}
						if (resize) cbuf(bt + 131072);
						var end = bt + add;
						if (bt < dt) {
							var shift = dl - dt, dend = Math.min(dt, end);
							if (shift + bt < 0) err(3);
							for (; bt < dend; ++bt) buf[bt] = dict[shift + bt];
						}
						for (; bt < end; ++bt) buf[bt] = buf[bt - dt];
					}
				}
				st.l = lm, st.p = lpos, st.b = bt, st.f = final;
				if (lm) final = 1, st.m = lbt, st.d = dm, st.n = dbt;
			} while (!final);
			return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
		};
		var et = /*#__PURE__*/ new u8(0);
		function inflateSync(data, opts) {
			return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
		}
		var td = typeof TextDecoder != "undefined" && /*#__PURE__*/ new TextDecoder();
		try {
			td.decode(et, { stream: true });
		} catch (e) {}
		var dutf8 = function(d) {
			for (var r = "", i = 0;;) {
				var c = d[i++];
				var eb = (c > 127) + (c > 223) + (c > 239);
				if (i + eb > d.length) return {
					s: r,
					r: slc(d, i - 1)
				};
				if (!eb) r += String.fromCharCode(c);
				else if (eb == 3) c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
				else if (eb & 1) r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
				else r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
			}
		};
		/**
		* Converts a Uint8Array to a string
		* @param dat The data to decode to string
		* @param latin1 Whether or not to interpret the data as Latin-1. This should
		*               not need to be true unless encoding to binary string.
		* @returns The original UTF-8/Latin-1 string
		*/
		function strFromU8(dat, latin1) {
			if (latin1) {
				var r = "";
				for (var i = 0; i < dat.length; i += 16384) r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
				return r;
			} else if (td) return td.decode(dat);
			else {
				var _a = dutf8(dat), s = _a.s, r = _a.r;
				if (r.length) err(8);
				return s;
			}
		}
		//#endregion
		//#region src/client/drawio.ts
		/**
		* draw.io file decoding: the bytes a document preview receives become the
		* mxGraph XML that a renderer consumes.
		*
		* A `.drawio` file holds either plain mxGraph XML or that same XML escaped,
		* raw-DEFLATE compressed, and base64 encoded by draw.io's own save path. Both
		* forms are decoded here so the renderer only ever sees XML.
		*
		* Inflating uses `fflate` rather than the platform `DecompressionStream`: the
		* platform stream reports a corrupt body through an internal rejection that
		* escapes as an unhandled error, and a malformed file must surface as a
		* rejection of this function instead.
		*/
		/**
		* Base64 alphabet plus the padding an encoder may add. `<`, `>`, and whitespace
		* fall outside it, so membership separates a compressed body from raw XML
		* without depending on a particular zlib header.
		*/
		const BASE64 = /^[\d+/A-Za-z=]+$/u;
		/** Base64 alphabet in index order, matching the value each character encodes. */
		const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		/** Raised when the bytes are neither mxGraph XML nor a decodable drawio payload. */
		var DrawioParseError = class extends Error {
			constructor(message) {
				super(message);
				this.name = "DrawioParseError";
			}
		};
		/**
		* Decode base64 to bytes without depending on a host global.
		*
		* `fflate`'s own string input is not used here: its base64 mode yields a
		* different byte sequence than the encoded payload, which then fails to inflate.
		* @param text - base64 text accepted by `BASE64`, optionally padded.
		* @returns exactly the decoded bytes.
		*/
		function fromBase64(text) {
			let length = 0;
			for (const character of text) if (character !== "=") length += 1;
			const bytes = new Uint8Array(length * 3 >> 2);
			let bits = 0;
			let accumulated = 0;
			let index = 0;
			for (const character of text) {
				if (character === "=") break;
				accumulated = accumulated << 6 | ALPHABET.indexOf(character);
				bits += 6;
				if (bits >= 8) {
					bits -= 8;
					bytes[index++] = accumulated >> bits & 255;
				}
			}
			return bytes;
		}
		/**
		* Reverse draw.io's base64 + raw-DEFLATE + percent-escape encoding.
		* @param payload - base64 diagram body accepted by `BASE64`.
		* @returns the diagram XML text.
		* @throws DrawioParseError when the body is not valid DEFLATE.
		*/
		function inflateXml(payload) {
			let escaped;
			try {
				escaped = strFromU8(inflateSync(fromBase64(payload)), true);
			} catch {
				throw new DrawioParseError("drawio: compressed body is not a valid DEFLATE stream");
			}
			try {
				return decodeURIComponent(escaped);
			} catch {
				return escaped;
			}
		}
		/**
		* Read the diagram XML out of a `.drawio` file.
		* @param data - complete file bytes as delivered by the document owner.
		* @returns the mxGraph XML text.
		* @throws DrawioParseError when the bytes carry no recognizable diagram.
		*/
		function decodeDrawioXml(data) {
			const text = new TextDecoder().decode(data).replace(/^\uFEFF/u, "").trim();
			if (text === "") throw new DrawioParseError("drawio: file is empty");
			if (text.includes("<mxGraphModel") || text.includes("<mxfile")) return text;
			if (BASE64.test(text)) return inflateXml(text);
			throw new DrawioParseError("drawio: no mxGraphModel element found");
		}
		//#endregion
		//#region \0dsh-css:C:\Users\Windows11\AppData\Local\Temp\dsh-I0sgSn\dsh-release-20261017\work\dsh-drawio\src\client\DrawioBody.module.css.mjs
		const css = ".d0sMDa_frame{justify-content:center;align-items:flex-start;width:max-content;min-width:100%;padding:12px;display:flex}.d0sMDa_diagram{user-select:none;max-width:none;height:auto}.d0sMDa_status{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);margin:0;padding:12px;display:block}.d0sMDa_loading{justify-items:center;gap:8px;padding:24px 12px;display:grid}.d0sMDa_skeleton{border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-skeleton);width:min(100%,320px);height:160px;animation:d0sMDa_drawioSkeletonPulse 1.4s var(--ds-ease-in-out) infinite}.d0sMDa_failure{justify-items:start;gap:8px;padding:12px;display:grid}.d0sMDa_retry{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);height:28px;color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-13);cursor:pointer;background:0 0;padding:0 12px}.d0sMDa_retry:hover{border-color:var(--dsw-alias-border-l4)}.d0sMDa_retry:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}@media (pointer:coarse){.d0sMDa_retry{min-height:44px}}@keyframes d0sMDa_drawioSkeletonPulse{0%,to{opacity:1}50%{opacity:.55}}@media (prefers-reduced-motion:reduce){.d0sMDa_skeleton{animation:none}}";
		const tagId = "@guowenzhang/dsh-drawio/DrawioBody.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var DrawioBody_module_css_default = {
			"diagram": "d0sMDa_diagram",
			"drawioSkeletonPulse": "d0sMDa_drawioSkeletonPulse",
			"failure": "d0sMDa_failure",
			"frame": "d0sMDa_frame",
			"loading": "d0sMDa_loading",
			"retry": "d0sMDa_retry",
			"skeleton": "d0sMDa_skeleton",
			"status": "d0sMDa_status"
		};
		//#endregion
		//#region src/client/DrawioBody.tsx
		/** draw.io document body: decoded file bytes rendered as a read-only diagram. */
		/**
		* Decode one file's bytes.
		*
		* A malformed file is a value here rather than a thrown render: it must not
		* unmount the surrounding tab, and its message has no retry because decoding is
		* deterministic — the same bytes fail the same way.
		* @param data - complete file bytes, absent when the owner delivered text.
		* @returns the XML text or the malformed marker.
		*/
		function decode(data) {
			if (data === void 0) return void 0;
			try {
				return {
					kind: "xml",
					xml: decodeDrawioXml(data)
				};
			} catch {
				return { kind: "malformed" };
			}
		}
		/**
		* Present a `.drawio` file as a diagram at the document's own size.
		*
		* The engine's layout runs offscreen and yields a `data:` URL, so the returned
		* `<img>` is the same element the image preview uses and the diagram keeps its
		* aspect ratio. The pane provides scrolling. The engine itself is fetched on the
		* first diagram, so the first paint is a placeholder of the same shape.
		* @param props - complete file bytes, resource identity, renderer, and locale.
		* @returns the diagram, a placeholder, or the reason it could not be drawn.
		*/
		function DrawioBody({ content, resourceAddress, renderDiagram, t }) {
			const data = content.kind === "bytes" ? content.data : void 0;
			/**
			* Decoding is memoized on the bytes, and the render effect below depends on the
			* decoded TEXT rather than on the byte array: a parent that hands over a fresh
			* array object per render must not re-arm the effect.
			*/
			const decoded = (0, react.useMemo)(() => decode(data), [data]);
			const [outcome, setOutcome] = (0, react.useState)({ kind: "loading" });
			/** Bumped by Retry to re-run the render with the same bytes. */
			const [attempt, setAttempt] = (0, react.useState)(0);
			const previous = (0, react.useRef)();
			(0, react.useEffect)(() => () => {
				previous.current?.dispose();
			}, []);
			const xml = decoded?.kind === "xml" ? decoded.xml : void 0;
			(0, react.useEffect)(() => {
				if (xml === void 0) return void 0;
				let active = true;
				previous.current?.dispose();
				previous.current = void 0;
				setOutcome({ kind: "loading" });
				renderDiagram(xml).then((diagram) => {
					if (!active) {
						diagram.dispose();
						return;
					}
					previous.current = diagram;
					setOutcome({
						kind: "ready",
						diagram
					});
				}, () => {
					if (active) setOutcome({ kind: "failed" });
				});
				return () => {
					active = false;
				};
			}, [
				xml,
				renderDiagram,
				attempt
			]);
			const name = (0, react.useMemo)(() => pathPartsOf(resourceAddress).name, [resourceAddress]);
			if (decoded === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: DrawioBody_module_css_default.status,
				role: "alert",
				children: t("unsupported")
			});
			if (decoded.kind === "malformed") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: DrawioBody_module_css_default.status,
				role: "alert",
				children: t("malformed")
			});
			if (outcome.kind === "failed") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: DrawioBody_module_css_default.failure,
				role: "alert",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: DrawioBody_module_css_default.status,
					children: t("failed")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: DrawioBody_module_css_default.retry,
					onClick: () => setAttempt((current) => current + 1),
					children: t("retry")
				})]
			});
			if (outcome.kind === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: DrawioBody_module_css_default.loading,
				role: "status",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: DrawioBody_module_css_default.skeleton,
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: DrawioBody_module_css_default.status,
					children: t("loading")
				})]
			});
			const { url, width, height } = outcome.diagram;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: DrawioBody_module_css_default.frame,
				"data-drawio-preview": true,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					className: DrawioBody_module_css_default.diagram,
					src: url,
					alt: t("preview", { name }),
					width,
					height,
					decoding: "async",
					draggable: false,
					referrerPolicy: "no-referrer"
				})
			});
		}
		//#endregion
		//#region src/client/definition.ts
		/** draw.io (mxGraph XML) metadata and keyed document-body identity. */
		/** Implementation identity shared by the preview metadata and its keyed body slot. */
		const DRAWIO_BODY_ID = "@guowenzhang/dsh-drawio";
		//#endregion
		//#region src/client/maxgraph-loader.ts
		/**
		* Draw one decoded diagram, loading the graphics engine on first use.
		* @param xml - decoded mxGraph XML.
		* @returns the rendered image and its disposer.
		* @throws when the XML is not a diagram the engine can lay out.
		*/
		async function renderDrawioDiagram(xml) {
			const { createMaxgraphRenderer } = await require.async("./client.maxgraph.js");
			return createMaxgraphRenderer().render(xml);
		}
		//#endregion
		//#region src/client/locales.ts
		/** Locale-owned draw.io preview labels and status text. */
		const zh = {
			title: "draw.io 图表",
			preview: "图表预览：{name}",
			loading: "正在绘制图表…",
			failed: "无法渲染这个图表。",
			retry: "重试",
			malformed: "这个文件不是有效的 draw.io XML。",
			unsupported: "draw.io 预览需要完整文件内容。"
		};
		/** English dictionary with the same keys as the Chinese dictionary. */
		const en = {
			title: "draw.io diagram",
			preview: "Diagram preview: {name}",
			loading: "Drawing the diagram…",
			failed: "This diagram could not be rendered.",
			retry: "Retry",
			malformed: "This file is not valid draw.io XML.",
			unsupported: "draw.io preview requires the complete file contents."
		};
		//#endregion
		//#region src/client/index.ts
		/** This package's copy namespace. */
		const NS = "sidebarDrawio";
		/** Required browser services: the slot registry, the document registry, and copy. */
		const inject = [
			"slots",
			"locale",
			"documentPreviews"
		];
		/**
		* Client plugin body: register the dictionary, the preview metadata, and the body.
		* @param ctx - client root context carrying the registries and copy.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-sidebar-drawio: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.effect(() => ctx.documentPreviews.register({
				id: DRAWIO_BODY_ID,
				extensions: ["drawio"],
				title: () => t("title"),
				loading: "bytes-complete",
				wrap: false
			}), "ui-sidebar-drawio: metadata");
			ctx.effect(() => ctx.slots.inject("sidebar.right.tab.document", () => ctx.slots.register({
				name: "sidebar.right.tab.document",
				key: DRAWIO_BODY_ID,
				locale: NS,
				inject: () => ({ renderDiagram: renderDrawioDiagram })
			}, DrawioBody)), "ui-sidebar-drawio: body");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
