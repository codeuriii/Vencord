/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { DataStore } from "@api/index";
import { showNotification } from "@api/Notifications";
import definePlugin, { StartAt } from "@utils/types";
import { Menu } from "@webpack/common";

function createPinMenuItem(userId: string) {
    return (
        <>
            <Menu.MenuItem
                id="set-decoration-avatar"
                label="Set Avatar Decoration"
                action={async () => {
                    let currentUrl = await DataStore.get("temporaireAvatarDecorationUrl") || "";
                    if (currentUrl) {
                        currentUrl = currentUrl.split("?")[0] + "?size=240&passthrough=false";
                        await saveDecorations(userId, currentUrl);
                        notify("Décoration appliqué !");
                    }
                }}
            >
            </Menu.MenuItem>
            <Menu.MenuItem
                id="set-plaque-nominative"
                label="Set Nameplate"
                action={async () => {
                    const currentUrl = await DataStore.get("temporaireAvatarDecorationUrl") || "";
                    if (currentUrl) {
                        const staticUrl = currentUrl.replace("asset.webm", "static.png");
                        await savePlaques(userId, [currentUrl, staticUrl]);
                        notify("Plaque nominative appliquée !");
                    }
                }}>
            </Menu.MenuItem>
        </>
    );
}

const notify = (text: string) => {
    setTimeout(() => showNotification({
        permanent: false,
        noPersist: true,
        title: "CodeurIII Plugin",
        body: text,
    }), 500);
};

async function saveDecorations(userId: string, url: string) {
    const decorationsAvatar = await DataStore.get("decorationsAvatar") || "";
    if (decorationsAvatar) {
        decorationsAvatar[userId] = [
            url,
            url.replace("assets.webm", "static.png")
        ];
        DataStore.set("decorationsAvatar", decorationsAvatar);
        return decorationsAvatar;
    }
    return null;
}

async function savePlaques(userId: string, urls: [string, string]) {
    const plaques = await DataStore.get("plaques") || {};
    plaques[userId] = urls;
    DataStore.set("plaques", plaques);
    return plaques;
}

const UserContext: NavContextMenuPatchCallback = (children, props) => {
    const container = findGroupChildrenByChildId("close-dm", children);
    if (container) {
        const idx = container.findIndex(c => c?.props?.id === "close-dm");
        container.splice(idx, 0, createPinMenuItem(props.user.id));
    }
};

const contextMenus = {
    "user-context": UserContext
};

const oldBadge = "https://cdn.discordapp.com/clan-badges/621302461600235531/59ae9c05acc03f2ea2f12c01c78c6bb1.png";
const newBadge = "https://cdn.discordapp.com/clan-badges/1369311130513834174/e701df75ce906698f0d02ce19bf7c8c6.png";


export default definePlugin({
    name: "CodeurIII Plugin",
    description: "TGR coeur blanc, décorations d'avatar et plaques nominatives personnalisées.",
    authors: [{ id: 839429032343765002n, name: "CodeurIII" }],
    contextMenus,
    version: "1.1.0",
    startAt: StartAt.WebpackReady,

    start() {
        this.observer = new MutationObserver(async () => {
            document.querySelectorAll<HTMLImageElement>("img.badge__10651").forEach(img => {
                if (img.src.includes(oldBadge)) {
                    img.src = img.src.replaceAll(oldBadge, newBadge);
                }
            });

            const decorationsAvatar = await DataStore.get("decorationsAvatar");
            if (!decorationsAvatar) {
                const decorationsAvatar = {};
                await DataStore.set("decorationsAvatar", decorationsAvatar);
            }

            document.querySelectorAll(".messageListItem__5126c").forEach(async messageListItem => {
                const avatar = messageListItem.querySelector<HTMLImageElement>("img.avatar_c19a55");
                if (avatar) {
                    let userId = "";
                    Object.keys(decorationsAvatar).forEach(userid => {
                        if (avatar.src.includes(userid)) {
                            userId = userid;
                            return;
                        }
                    });
                    if (userId === "") return;
                    const parent = avatar.parentElement;
                    if (parent && !parent.querySelector("img.avatarDecoration_c19a55")) {
                        const decoration = document.createElement("img");
                        decoration.src = decorationsAvatar[userId];
                        decoration.className = "avatarDecoration_c19a55";
                        let ancestor = parent;
                        while (ancestor && ancestor.tagName && ancestor.tagName.toLowerCase() !== "li") {
                            ancestor = ancestor.parentElement!;
                        }
                        ancestor.addEventListener("mouseenter", () => {
                            decoration.src = decoration.src.replace("false", "true");
                        });
                        ancestor.addEventListener("mouseleave", () => {
                            decoration.src = decoration.src.replace("true", "false");
                        });

                        parent.insertBefore(decoration, avatar.nextSibling);
                    }
                } else {
                    let searchElem: Element | null = messageListItem.previousElementSibling;
                    let foundDecoration: HTMLImageElement | null = null;
                    while (searchElem) {
                        foundDecoration = searchElem.querySelector("img.avatarDecoration_c19a55");
                        if (foundDecoration) break;
                        searchElem = searchElem.previousElementSibling;
                    }

                    if (foundDecoration) {
                        messageListItem.addEventListener("mouseenter", () => {
                            foundDecoration!.src = foundDecoration!.src.replace("false", "true");
                        });
                        messageListItem.addEventListener("mouseleave", () => {
                            foundDecoration!.src = foundDecoration!.src.replace("true", "false");
                        });
                    }
                }
            });

            // Dimension x de l'image: dimension x de la décoration
            const dimensions = {
                "x138": "162",
                "y138": "144",
                "x92": "108",
                "y92": "96",
                "x80": "94",
                "y80": "94",
                "x40": "46.4",
                "y40": "38.4",
                "x32": "38.4",
                "y32": "38.4",
                "x16": "19.2",
                "y16": "19.2"
            };

            // Décoration pour le profil a droite en mp + éventuellement sur les serveurs
            const element = "<svg width=\"x260\" height=\"x261\" viewBox=\"0 0 x260 x261\" class=\"avatarDecoration__44b0c\" aria-hidden=\"true\"><foreignObject x=\"0\" y=\"0\" width=\"x261\" height=\"x261\" mask=\"url(#svg-mask-avatar-decoration-status-round-x262)\"><div class=\"avatarStack__44b0c\"><img class=\"avatar__44b0c\" alt=\" \" aria-hidden=\"true\" src=\"x280\"></div></foreignObject></svg>";
            const wrappers = Array.from(document.querySelectorAll(".wrapper__44b0c"));
            for (const wrapper of wrappers) {
                if (!wrapper.querySelector(".avatarDecoration__44b0c")) {
                    const avatar = wrapper.querySelector<HTMLImageElement>(".avatar__44b0c")!;
                    let userId = "";
                    Object.keys(decorationsAvatar).forEach(userid => {
                        if (avatar.src.includes(userid)) {
                            userId = userid;
                            return;
                        }
                    });
                    if (userId === "") continue;
                    const firstSvg = wrapper.querySelector("svg");
                    if (firstSvg) {
                        const temp = document.createElement("div");
                        let url = decorationsAvatar[userId];
                        if (!["40", "16"].includes(firstSvg.getAttribute("width")!)) {
                            url = url.replace("false", "true");
                        }
                        temp.innerHTML = element.replaceAll("x280", url)
                            .replaceAll("x260", dimensions["x" + firstSvg.getAttribute("width")!])
                            .replaceAll("x261", dimensions["y" + firstSvg.getAttribute("height")!])
                            .replaceAll("x262", firstSvg.querySelector("foreignObject")!.getAttribute("mask")!.split("-").pop()!.replace(")", "")!);
                        const node = temp.firstElementChild;
                        firstSvg.parentElement!.insertBefore(node!, firstSvg.nextSibling);
                    }

                    // Mp part
                    const ancestor = wrapper.parentElement!.parentElement!.parentElement!.parentElement!.parentElement!;
                    if (ancestor.tagName.toLocaleLowerCase() === "li") {
                        ancestor.addEventListener("mouseenter", () => {
                            const img = ancestor.querySelector(".avatarDecoration__44b0c")?.querySelector("img");
                            if (img) {
                                img.src = img.src.replace("false", "true");
                            }
                        });
                        ancestor.addEventListener("mouseleave", () => {
                            const img = ancestor.querySelector(".avatarDecoration__44b0c")?.querySelector("img");
                            if (img) {
                                img.src = img.src.replace("true", "false");
                            }
                        });
                    }
                }
            }

            document.querySelectorAll(".peopleListItem_cc6179").forEach(peopleListItem => {
                const svgElement = peopleListItem.querySelector<SVGElement>(".avatarDecoration__44b0c");
                const decorationImg = svgElement?.querySelector("img");
                if (decorationImg) {
                    peopleListItem.addEventListener("mouseenter", () => {
                        decorationImg.src = decorationImg.src.replace("false", "true");
                    });
                    peopleListItem.addEventListener("mouseleave", () => {
                        decorationImg.src = decorationImg.src.replace("true", "false");
                    });
                }
            });

            // Faire la plaque nominative
            const plaques = await DataStore.get("plaques");
            if (!plaques) {
                const plaques = {};
                await DataStore.set("plaques", plaques);
            }

            const videoElement = "<div class=\"container__4bbc6\" aria-hidden=\"true\" style=\"background: linear-gradient(90deg, transparent 0%, rgba(8, 100, 96, 0.08) 20%, rgba(8, 100, 96, 0.08) 50%, rgba(8, 100, 96, 0.2) 100%);\"><div class=\"videoContainer__4bbc6\" style=\"mask-image: linear-gradient(to right, rgba(0, 0, 0, 0.3) 147.812px, rgb(0, 0, 0) 197.812px);\"><video src=\"x280\" poster=\"x281\" playsinline class=\"img__4bbc6\" tabindex=\"-1\" loop></video></div></div>";
            document.querySelectorAll(".childContainer__91a9d").forEach(container => {
                if (container.querySelector("video")) return;
                const avatar = container.querySelector("img")!;
                let userId = "";
                Object.keys(plaques).forEach(userid => {
                    if (avatar.src.includes(userid)) {
                        userId = userid;
                        return;
                    }
                });
                if (userId === "") {
                    let userId2 = "";
                    Object.keys(decorationsAvatar).forEach(userid2 => {
                        if (avatar.src.includes(userid2)) {
                            userId2 = userid2;
                            return;
                        }
                    });
                    if (userId2 === "") return;
                    container.addEventListener("mouseenter", () => {
                        const img = container.querySelector(".avatarDecoration__44b0c")?.querySelector("img");
                        if (img) {
                            img.src = img.src.replace("false", "true");
                        }
                    });
                    container.addEventListener("mouseleave", () => {
                        const img = container.querySelector(".avatarDecoration__44b0c")?.querySelector("img");
                        if (img) {
                            img.src = img.src.replace("true", "false");
                        }
                    });
                    const img = container.querySelector(".avatarDecoration__44b0c")?.querySelector("img");
                    if (img) {
                        img.src = img.src.replace("true", "false");
                    }
                    return;
                }
                const temp = document.createElement("div");
                temp.innerHTML = videoElement.replaceAll("x280", plaques[userId][0])
                    .replaceAll("x281", plaques[userId][1]);
                container.addEventListener("mouseenter", () => {
                    const video = container.querySelector("video")!;
                    const img = container.querySelector(".avatarDecoration__44b0c")?.querySelector("img");
                    if (img) {
                        img.src = img.src.replace("false", "true");
                    }
                    video.play();
                });
                container.addEventListener("mouseleave", () => {
                    const video = container.querySelector("video")!;
                    const img = container.querySelector(".avatarDecoration__44b0c")?.querySelector("img");
                    if (img) {
                        img.src = img.src.replace("true", "false");
                    }
                    video.pause();
                });
                const node = container.firstChild;
                container.insertBefore(temp.firstChild!, node!);
            });

            // Boutique part
            document.querySelectorAll(".productCardContainer_fcbddd").forEach(shopCard => {
                const avatarContainer = shopCard.querySelector(".wrapper__44b0c.avatar_d71c71");
                const nameplateContainer = shopCard.querySelector(".nameplatePreviewSampleItem_f7b5db.nameplatePreview_e144e0");
                const title = shopCard.querySelector("h2")?.textContent;
                if (title?.toLowerCase().includes("pack")) return;
                if (shopCard.getAttribute("codeuriii") === "true") return;
                shopCard.addEventListener("mouseenter", () => {
                    setTimeout(() => {
                        const wishlistBtn = shopCard.querySelector('div[aria-label="Ajouter à ta liste de souhaits"]');
                        const svgElement = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-arrow-down-to-line-icon lucide-arrow-down-to-line\"><path d=\"M12 17V3\"/><path d=\"m6 11 6 6 6-6\"/><path d=\"M19 21H5\"/></svg>";
                        if (wishlistBtn) {
                            const clone = wishlistBtn.cloneNode(true) as HTMLElement;
                            clone.innerHTML = svgElement;
                            clone.classList.add("codeuriii-save-button");
                            clone.classList.remove("wishlistButton_c3d04b");
                            clone.style.insetInlineStart = "10px";
                            clone.style.position = "absolute";
                            clone.style.top = "10px";
                            clone.style.zIndex = "1";
                            clone.style.pointerEvents = "auto";
                            const stop = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
                            ["click", "mousedown", "mouseup", "touchstart", "touchend", "contextmenu"].forEach(evt =>
                                clone.addEventListener(evt, stop as EventListener, { passive: false })
                            );
                            if (avatarContainer) {
                                clone.addEventListener("click", async () => {
                                    const url = Array.from(avatarContainer.querySelectorAll("img")).reverse()[0].src;
                                    await DataStore.set("temporaireAvatarDecorationUrl", url);
                                    notify("Décoration stockée temporairement !");
                                });
                            } else if (nameplateContainer) {
                                clone.addEventListener("click", async () => {
                                    const video = nameplateContainer.querySelector("video");
                                    const url = video!.src;
                                    await DataStore.set("temporaireAvatarDecorationUrl", url);
                                    notify("Plaque nominative stockée temporairement !");
                                });
                            }
                            wishlistBtn.parentElement!.insertBefore(clone, wishlistBtn);
                        }
                    }, 20);
                });
                shopCard.addEventListener("mouseleave", () => {
                    const boutons = shopCard!.querySelectorAll(".codeuriii-save-button");
                    for (const bouton of boutons) {
                        bouton.remove();
                    }
                });
                shopCard.setAttribute("codeuriii", "true");
            });
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
    },
    stop() {
        if (this.observer) this.observer.disconnect();
    }

});
