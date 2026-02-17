export type SocialLink = { label: string; href: string };
export type ExperienceItem = { title: string; imgSrc: string; caption: string };
export type ProjectItem = { title: string; subtitle: string; href: string };
export type AmaMediaKind = "image" | "video" | "iframe";

export type AmaMedia = {
	kind: AmaMediaKind;
	src: string;
	alt?: string;
	caption?: string;
};

export type AmaItem = {
	emoji: string;
	title: string;
	body: string;
	media?: AmaMedia;
};
