/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { DataStore } from "@api/index";
import { showNotification } from "@api/Notifications";
import definePlugin, { StartAt } from "@utils/types";
import type { Channel, User } from "@vencord/discord-types";
import { Menu } from "@webpack/common";

function createPinMenuItem(userId: string) {
    return (
        <Menu.MenuItem
            id="codeuriii-decorations"
            label="CodeurIII Decorations"
        >
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
                    const currentUrl = await DataStore.get("temporaireNameplateUrl") || "";
                    if (currentUrl) {
                        const staticUrl = currentUrl.replace("asset.webm", "static.png");
                        await savePlaques(userId, [currentUrl, staticUrl]);
                        notify("Plaque nominative appliquée !");
                    }
                }}>
            </Menu.MenuItem>
            <Menu.MenuItem
                id="set-profile-effect"
                label="Set Profile Effect"
                action={async () => {
                    const currentUrls = await DataStore.get("temporaireProfileEffectUrls") || "";
                    if (currentUrls) {
                        await saveProfileEffect(userId, currentUrls);
                        notify("Effet de profil appliqué !");
                    }
                }}>
            </Menu.MenuItem>

            <Menu.MenuSeparator />

            <Menu.MenuItem
                id="remove-decoration-avatar"
                label="Remove Avatar Decoration"
                action={async () => {
                    const decorationsAvatar = await DataStore.get("decorationsAvatar") || {};
                    if (decorationsAvatar && decorationsAvatar[userId]) {
                        delete decorationsAvatar[userId];
                        await DataStore.set("decorationsAvatar", decorationsAvatar);
                        notify("Décoration supprimée !");
                    }
                }}
            >
            </Menu.MenuItem>
            <Menu.MenuItem
                id="remove-plaque-nominative"
                label="Remove Nameplate"
                action={async () => {
                    const plaques = await DataStore.get("plaques") || {};
                    if (plaques && plaques[userId]) {
                        delete plaques[userId];
                        await DataStore.set("plaques", plaques);
                        notify("Plaque nominative supprimée !");
                    }
                }}>
            </Menu.MenuItem>
            <Menu.MenuItem
                id="remove-profile-effect"
                label="Remove Profile Effect"
                action={async () => {
                    const profileEffects = await DataStore.get("profileEffects") || {};
                    if (profileEffects && profileEffects[userId]) {
                        delete profileEffects[userId];
                        await DataStore.set("profileEffects", profileEffects);
                        notify("Effet de profil supprimée !");
                    }
                }}>
            </Menu.MenuItem>

            <Menu.MenuSeparator />

            <Menu.MenuItem
                id="apply-all"
                label="Apply All"
                action={async () => {
                    const temporaryDecorationsAvatar = await DataStore.get("temporaireAvatarDecorationUrl") || "";
                    const temporaryPlaque = await DataStore.get("temporaireNameplateUrl") || "";
                    const temporaryProfileEffect = await DataStore.get("temporaireProfileEffectUrls") || "";

                    if (temporaryDecorationsAvatar) await saveDecorations(userId, temporaryDecorationsAvatar);
                    if (temporaryPlaque) await savePlaques(userId, temporaryPlaque);
                    if (temporaryProfileEffect) await saveProfileEffect(userId, temporaryProfileEffect);

                    notify("Tous les éléments appliqués !");
                }}
            />
            <Menu.MenuItem
                id="remove-all"
                label="Remove All"
                action={async () => {
                    const decorationsAvatar = await DataStore.get("decorationsAvatar") || {};
                    const plaques = await DataStore.get("plaques") || {};
                    const profileEffects = await DataStore.get("profileEffects") || {};

                    if (decorationsAvatar && decorationsAvatar[userId]) delete decorationsAvatar[userId];
                    if (plaques && plaques[userId]) delete plaques[userId];
                    if (profileEffects && profileEffects[userId]) delete profileEffects[userId];

                    await DataStore.set("decorationsAvatar", decorationsAvatar);
                    await DataStore.set("plaques", plaques);
                    await DataStore.set("profileEffects", profileEffects);

                    notify("Tous les éléments supprimés !");
                }}
            />
            <Menu.MenuItem
                id="clear-temporary-storage"
                label="Clear temporary storage"
                action={async () => {
                    await DataStore.set("temporaireAvatarDecorationUrl", "");
                    await DataStore.set("temporaireNameplateUrl", "");
                    await DataStore.set("temporaireProfileEffectUrls", "");

                    notify("Stockage temporaire vidé !");
                }}
            />

        </Menu.MenuItem>
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
    const decorationsAvatar = await DataStore.get("decorationsAvatar") || {};
    decorationsAvatar[userId] = url;
    await DataStore.set("decorationsAvatar", decorationsAvatar);
}

async function savePlaques(userId: string, urls: [string, string]) {
    const plaques = await DataStore.get("plaques") || {};
    plaques[userId] = urls;
    await DataStore.set("plaques", plaques);
    return plaques;
}

async function saveProfileEffect(userId: string, urls: []) {
    const profileEffects = await DataStore.get("profileEffects") || {};
    profileEffects[userId] = urls;
    await DataStore.set("profileEffects", profileEffects);
    return profileEffects;
}

interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user: User;
}

const UserContext: NavContextMenuPatchCallback = (children, { user, guildId }: UserContextProps) => {
    if (!user) return;

    const closeDmContainer = findGroupChildrenByChildId("close-dm", children);
    const profileContainer = findGroupChildrenByChildId("user-profile", children);

    if (closeDmContainer) {
        const idx = closeDmContainer.findIndex(c => c?.props?.id === "close-dm");
        closeDmContainer.splice(idx, 0, createPinMenuItem(user.id));
    } else if (profileContainer) {
        profileContainer.splice(-1, 0, createPinMenuItem(user.id));
    }
};

const contextMenus = {
    "user-context": UserContext
};

const oldBadge = "https://cdn.discordapp.com/clan-badges/621302461600235531/59ae9c05acc03f2ea2f12c01c78c6bb1.png";
const newBadge = "https://cdn.discordapp.com/clan-badges/1369311130513834174/e701df75ce906698f0d02ce19bf7c8c6.png";

const paths = {
    // Icone de badge
    img_badge: "img.badge__10651",

    // Messages dans la conv
    messageListItem: ".messageListItem__5126c",
    littleAvatar: "img.avatar_c19a55",
    littleAvatarDecoration: "img.avatarDecoration_c19a55",

    // DM profile
    littleAvatarDecorationClassName: "avatarDecoration_c19a55",
    wrapper: ".wrapper__44b0c",

    // Profile partout
    bigAvatar: ".avatar__44b0c",
    bigAvatarClassName: "avatar__44b0c",
    bigAvatarDecoration: ".avatarDecoration__44b0c",
    bigAvatarDecorationClassName: "avatarDecoration__44b0c",
    avatarDecorationContainer: ".avatarDecorationContainer__44b0c",
    avatarDecorationContainerClassName: "avatarDecorationContainer__44b0c",

    // Membres d'un serveur discord, sur la droite
    peopleListItem: ".member_c8ffbb",
    videoImgClassName: "img__4bbc6",
    videoContainerClassName: "videoContainer__4bbc6",
    divVideoContainerClassName: "container__4bbc6",
    childContainer: ".childContainer__91a9d",

    productContainer: ".productCardContainer_fcbddd",

    // Shop
    avatarContainer: ".wrapper__44b0c.avatar_d71c71",
    nameplateContainer: ".nameplatePreviewSampleItem_f7b5db.nameplatePreview_e144e0",
    nameplatePreview: ".nameplatePreview_e144e0",
    profileEffect: ".profileEffects__01370",
    profileEffectClassName: "profileEffects__01370",
    wishlistButton: ".wishlistButton__979b1.wishlistButton__7b466",

    divInner: "div.inner_c0bea0"
};

export default definePlugin({
    name: "CodeurIII Plugin",
    description: "TGR coeur blanc, décorations d'avatar et plaques nominatives personnalisées.",
    authors: [{ id: 839429032343765002n, name: "CodeurIII" }],
    contextMenus,
    version: "1.1.0",
    startAt: StartAt.WebpackReady,

    start() {
        this.observer = new MutationObserver(async () => {


            document.querySelectorAll<HTMLImageElement>(paths.img_badge).forEach(img => {
                if (img.src.includes(oldBadge)) {
                    img.src = img.src.replaceAll(oldBadge, newBadge);
                }
            });

            const decorationsAvatar = await DataStore.get("decorationsAvatar");
            if (!decorationsAvatar) {
                const decorationsAvatar = {};
                await DataStore.set("decorationsAvatar", decorationsAvatar);
            }

            document.querySelectorAll(paths.messageListItem).forEach(async messageListItem => {
                const avatar = messageListItem.querySelector<HTMLImageElement>(paths.littleAvatar);
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
                    if (parent && !parent.querySelector(paths.littleAvatarDecoration)) {
                        const decoration = document.createElement("img");
                        decoration.src = decorationsAvatar[userId];
                        decoration.className = paths.littleAvatarDecorationClassName;
                        let ancestor = parent;
                        while (ancestor && ancestor.tagName && ancestor.tagName.toLowerCase() !== "li") {
                            ancestor = ancestor.parentElement!;
                        }
                        ancestor.addEventListener("mouseenter", () => {
                            decoration.src = decoration.src.replaceAll("false", "true");
                        });
                        ancestor.addEventListener("mouseleave", () => {
                            decoration.src = decoration.src.replaceAll("true", "false");
                        });

                        parent.insertBefore(decoration, avatar.nextSibling);
                    }
                } else {
                    let searchElem: Element | null = messageListItem.previousElementSibling;
                    let foundDecoration: HTMLImageElement | null = null;
                    while (searchElem) {
                        foundDecoration = searchElem.querySelector(paths.littleAvatarDecoration);
                        if (foundDecoration) break;
                        searchElem = searchElem.previousElementSibling;
                    }

                    if (foundDecoration) {
                        messageListItem.addEventListener("mouseenter", () => {
                            foundDecoration!.src = foundDecoration!.src.replaceAll("false", "true");
                        });
                        messageListItem.addEventListener("mouseleave", () => {
                            foundDecoration!.src = foundDecoration!.src.replaceAll("true", "false");
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
            const element = `<svg width="x260" height="x261" viewBox="0 0 x260 x261" class="${paths.avatarDecorationContainerClassName}" aria-hidden="true"><foreignObject x="0" y="0" width="x261" height="x261" mask="url(#svg-mask-avatar-decoration-status-round-x262)"><img class="${paths.bigAvatarDecorationClassName}" alt=" " aria-hidden="true" src="x280"></foreignObject></svg>`;
            const wrappers = Array.from(document.querySelectorAll(paths.wrapper));
            for (const wrapper of wrappers) {
                if (!wrapper.querySelector(paths.bigAvatarDecoration)) {
                    const avatar = wrapper.querySelector<HTMLImageElement>(paths.bigAvatar)!;
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
                        if (!["40", "32", "16"].includes(firstSvg.getAttribute("width")!)) {
                            url = url.replaceAll("false", "true");
                            console.log("here");
                        }
                        let mask: string | string[];
                        mask = firstSvg.querySelector("foreignObject")!.getAttribute("mask")!.split("-").pop()!.replace(")", "")!;
                        if (mask.includes("«")) {
                            mask = "32";
                        }
                        temp.innerHTML = element.replaceAll("x280", url)
                            .replaceAll("x260", dimensions["x" + firstSvg.getAttribute("width")!])
                            .replaceAll("x261", dimensions["y" + firstSvg.getAttribute("height")!])
                            .replaceAll("x262", mask);
                        const node = temp.firstElementChild;
                        firstSvg.parentElement!.insertBefore(node!, firstSvg.nextSibling);
                    }

                    // Mp part
                    const ancestor = wrapper.parentElement!.parentElement!.parentElement!.parentElement!.parentElement!;
                    if (ancestor.tagName.toLocaleLowerCase() === "li") {
                        ancestor.addEventListener("mouseenter", () => {
                            const img = ancestor.querySelector(paths.bigAvatarDecoration)?.querySelector("img");
                            if (img) {
                                img.src = img.src.replaceAll("false", "true");
                            }
                        });
                        ancestor.addEventListener("mouseleave", () => {
                            const img = ancestor.querySelector(paths.bigAvatarDecoration)?.querySelector("img");
                            if (img) {
                                img.src = img.src.replaceAll("true", "false");
                            }
                        });
                    }
                }
            }

            document.querySelectorAll(paths.peopleListItem).forEach(peopleListItem => {
                const svgElement = peopleListItem.querySelector<SVGElement>(paths.bigAvatarDecoration);
                const decorationImg = svgElement?.querySelector("img");
                if (decorationImg) {
                    peopleListItem.addEventListener("mouseenter", () => {
                        decorationImg.src = decorationImg.src.replaceAll("false", "true");
                    });
                    peopleListItem.addEventListener("mouseleave", () => {
                        decorationImg.src = decorationImg.src.replaceAll("true", "false");
                    });
                }
            });

            // Faire la plaque nominative
            const plaques = await DataStore.get("plaques");
            if (!plaques) {
                const plaques = {};
                await DataStore.set("plaques", plaques);
            }

            const videoElement = `<div class="${paths.divVideoContainerClassName}" aria-hidden="true" style="background: linear-gradient(90deg, transparent 0%, rgba(8, 100, 96, 0.08) 20%, rgba(8, 100, 96, 0.08) 50%, rgba(8, 100, 96, 0.2) 100%);"><div class="${paths.videoContainerClassName}" style="mask-image: linear-gradient(to right, rgba(0, 0, 0, 0.3) 147.812px, rgb(0, 0, 0) 197.812px);"><video src="x280" poster="x281" playsinline class="${paths.videoImgClassName}" tabindex="-1" loop></video></div></div>`;
            document.querySelectorAll(paths.childContainer).forEach(container => {
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
                        const img = container.querySelector(paths.bigAvatarDecoration)?.querySelector("img");
                        if (img) {
                            img.src = img.src.replaceAll("false", "true");
                        }
                    });
                    container.addEventListener("mouseleave", () => {
                        const img = container.querySelector(paths.bigAvatarDecoration)?.querySelector("img");
                        if (img) {
                            img.src = img.src.replaceAll("true", "false");
                        }
                    });
                    const img = container.querySelector(paths.bigAvatarDecoration)?.querySelector("img");
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
                    const img = container.querySelector(paths.avatarDecorationContainer)?.querySelector("img");
                    if (img) {
                        img.src = img.src.replaceAll("false", "true");
                    }
                    video.play();
                });
                container.addEventListener("mouseleave", () => {
                    const video = container.querySelector("video")!;
                    const img = container.querySelector(paths.avatarDecorationContainer)?.querySelector("img");
                    if (img) {
                        img.src = img.src.replaceAll("true", "false");
                    }
                    video.pause();
                });
                const node = container.firstChild;
                container.insertBefore(temp.firstChild!, node!);
            });

            // Boutique part
            document.querySelectorAll(paths.productContainer).forEach(shopCard => {
                const avatarContainer = shopCard.querySelector(paths.avatarContainer);
                const nameplateContainer = shopCard.querySelector(paths.nameplateContainer) || shopCard.querySelector(paths.nameplatePreview);
                const profileEffectContainer = shopCard.querySelector(paths.profileEffect);
                if (shopCard.getAttribute("codeuriii") === "true") return;
                shopCard.addEventListener("mouseenter", () => {
                    setTimeout(() => {
                        const wishlistBtn = shopCard.querySelector(paths.wishlistButton);
                        const svgElement = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-arrow-down-to-line-icon lucide-arrow-down-to-line\"><path d=\"M12 17V3\"/><path d=\"m6 11 6 6 6-6\"/><path d=\"M19 21H5\"/></svg>";
                        if (wishlistBtn) {
                            const clone = wishlistBtn.cloneNode(true) as HTMLElement;
                            clone.innerHTML = svgElement;
                            clone.classList.add("codeuriii-save-button");
                            clone.style.insetInlineStart = "10px";
                            clone.style.position = "absolute";
                            clone.style.top = "10px";
                            clone.style.zIndex = "1";
                            clone.style.pointerEvents = "auto";
                            clone.style.cursor = "pointer";
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
                            }
                            if (nameplateContainer) {
                                clone.addEventListener("click", async () => {
                                    const video = nameplateContainer.querySelector("video");
                                    const url = video!.src;
                                    await DataStore.set("temporaireNameplateUrl", url);
                                    notify("Plaque nominative stockée temporairement !");
                                });
                            }
                            if (profileEffectContainer) {
                                clone.addEventListener("click", async () => {
                                    // TODO
                                    const profileEffects = shopCard.querySelector(paths.profileEffect);
                                    if (profileEffects) {
                                        const images = Array.from(profileEffects.querySelectorAll("img"));
                                        const srcs = images.map(img => img.src);
                                        srcs.pop(); // remove the transparent 1x1 gif
                                        await DataStore.set("temporaireProfileEffectUrls", srcs);
                                        notify("Effet de profil stocké temporairement !");
                                    }
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

            function DOMProfileDecoration() {
                const container = document.querySelector(paths.divInner);
                let userId = "";
                userId = container?.querySelector<HTMLImageElement>(paths.bigAvatar)?.src.split("/")[4]!.split("?")[0] || "";
                // console.log(userId);
                if (userId !== "some id") return;

                const profileDecoration = document.createElement("div");
                profileDecoration.className = paths.profileEffectClassName;
                profileDecoration.setAttribute("role", "img");
                profileDecoration.setAttribute("aria-label", "Un galion pirate hanté dérive sinistrement à travers le profil, un spectacle qui donne la chair de poule même aux marins les plus endurcis.");
                // TODO
                profileDecoration.innerHTML = "<div class=\"inner__01370\"><img alt=\"\" aria-hidden=\"true\" src=\"https://cdn.discordapp.com/assets/content/882db9a69083943f1f9a474527cb5a639b380e3f84070a8c2809a9258e28c29a?query=dmView\" class=\"effect__01370\" style=\"top: 0px; left: 0px;\"><img alt=\"\" aria-hidden=\"true\" src=\"data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==\"></div>";
                if (!container?.querySelector(paths.profileEffect)) {
                    container?.appendChild(profileDecoration);
                    setTimeout(() => {
                        // TODO
                        profileDecoration.innerHTML = "<div class=\"inner__01370\"><img alt=\"\" aria-hidden=\"true\" src=\"https://cdn.discordapp.com/assets/content/8d072dbcdb5b4cdfcf4bfaf7cc3289b49f297250bd7f1075b39dc0a6862437aa?query=dmView\" class=\"effect__01370\" style=\"top: 0px; left: 0px;\"><img alt=\"\" aria-hidden=\"true\" src=\"data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==\"></div>";
                    }, 3000);
                }
            }

            DOMProfileDecoration();
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
    },
    stop() {
        if (this.observer) this.observer.disconnect();
    }

});
