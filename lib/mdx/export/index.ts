export { Callout } from "./components/Callout";
export { StatCard } from "./components/StatCard";
export { Quote } from "./components/Quote";
export { StepGuide } from "./components/StepGuide";
export { Chart } from "./components/Chart";
export { ImageWithCaption } from "./components/ImageWithCaption";

// MDX Components object for use with next-mdx-remote or similar
export const mdxComponents = {
    Callout: require("./components/Callout").Callout,
    StatCard: require("./components/StatCard").StatCard,
    Quote: require("./components/Quote").Quote,
    StepGuide: require("./components/StepGuide").StepGuide,
    Chart: require("./components/Chart").Chart,
    ImageWithCaption: require("./components/ImageWithCaption").ImageWithCaption,
};
