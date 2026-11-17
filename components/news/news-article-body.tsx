import {cloneElement, isValidElement, type ReactNode} from "react";
import {
  RichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";

import type {ArticleImageBlockFields} from "@/blocks/article-image";
import {ArticleImageBlock} from "@/components/news/article-image-block";
import {ArticleUploadImage} from "@/components/news/article-upload-image";
import {
  articleProseClassName,
  classifyArticleProseNodes,
  type ArticleProseRole,
} from "@/lib/news/article-prose";
import {
  extractNewsToc,
  getNewsHeadingText,
  getNewsTocHeadingLevel,
  normalizeNewsHeadingTag,
} from "@/lib/news/toc";
import type {Article} from "@/payload-types";

type NewsArticleBodyProps = {
  content: Article["content"];
  fallbackAlt: string;
  creditPrefix: string;
  creditOn: string;
  sourceLabel: string;
};

type HeadingNode = {
  tag?: unknown;
  children?: unknown[];
};

function invokeConverter(converter: unknown, args: object): ReactNode {
  if (typeof converter !== "function") return null;
  return converter(args) as ReactNode;
}

function withProseClass(rendered: ReactNode, role: ArticleProseRole | undefined): ReactNode {
  if (!role || !isValidElement<{className?: string}>(rendered)) return rendered;

  const className = articleProseClassName(role);
  const existing = rendered.props.className;

  return cloneElement(rendered, {
    className: existing ? `${existing} ${className}` : className,
  });
}

export function NewsArticleBody({
  content,
  fallbackAlt,
  creditPrefix,
  creditOn,
  sourceLabel,
}: NewsArticleBodyProps) {
  const tocItems = extractNewsToc(content);
  const roles = classifyArticleProseNodes(content);
  let headingCursor = 0;

  const converters: JSXConvertersFunction = ({defaultConverters}) => ({
    ...defaultConverters,
    blocks: {
      ...defaultConverters.blocks,
      articleImage: ({node}: {node: {fields?: ArticleImageBlockFields}}) => (
        <ArticleImageBlock
          fields={node.fields ?? {}}
          fallbackAlt={fallbackAlt}
          creditPrefix={creditPrefix}
          creditOn={creditOn}
          sourceLabel={sourceLabel}
        />
      ),
    },
    upload: ({node}) => <ArticleUploadImage node={node} fallbackAlt={fallbackAlt} />,
    paragraph: (args) =>
      withProseClass(invokeConverter(defaultConverters.paragraph, args), roles.get(args.node)),
    list: (args) =>
      withProseClass(invokeConverter(defaultConverters.list, args), roles.get(args.node)),
    quote: (args) =>
      withProseClass(invokeConverter(defaultConverters.quote, args), roles.get(args.node)),
    heading: ({node, nodesToJSX}) => {
      const headingNode = node as HeadingNode;
      const tag = normalizeNewsHeadingTag(headingNode.tag);
      const children = nodesToJSX({
        nodes: (Array.isArray(headingNode.children) ? headingNode.children : []) as Parameters<
          typeof nodesToJSX
        >[0]["nodes"],
      });
      const role = roles.get(node);
      const proseClass = role ? articleProseClassName(role) : undefined;
      const Heading = tag;

      if (getNewsTocHeadingLevel(headingNode.tag) !== null && getNewsHeadingText(node)) {
        const item = tocItems[headingCursor++];
        if (item?.id) {
          return (
            <Heading id={item.id} className={proseClass}>
              {children}
            </Heading>
          );
        }
      }

      return <Heading className={proseClass}>{children}</Heading>;
    },
  });

  return <RichText data={content} className="article-copy" converters={converters} />;
}
