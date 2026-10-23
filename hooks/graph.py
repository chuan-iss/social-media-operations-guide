"""Build a small link graph from published Markdown pages."""

import json
import posixpath
import re
from pathlib import Path
from urllib.parse import unquote

from mkdocs.structure.files import Files


_pages = []


def on_page_markdown(markdown, page, config, **kwargs):
    # Keep source notes untouched while resolving old repository-prefixed links.
    return markdown.replace("](social_docs/docs/", "](")


def on_files(files: Files, config, **kwargs):
    global _pages
    _pages = [file for file in files.documentation_pages() if file.src_uri.endswith(".md")]


def on_post_build(config, **kwargs):
    by_source = {file.src_uri: file for file in _pages}
    nodes = []
    edges = set()

    for file in _pages:
        source = Path(config.docs_dir) / file.src_uri
        content = source.read_text(encoding="utf-8")
        title = next((line.lstrip("# ").strip() for line in content.splitlines()
                      if line.startswith("# ")), source.stem)
        nodes.append({"id": file.src_uri, "title": title,
                      "url": config.site_url.rstrip("/") + "/" + file.url.lstrip("./")})

        for raw_link in re.findall(r"(?<!!)\[[^]]*\]\(([^)]+)\)", content):
            link = unquote(raw_link.split("#", 1)[0].split("?", 1)[0])
            if not link or "://" in link or link.startswith("#"):
                continue
            link = link.removeprefix("social_docs/docs/")
            target = posixpath.normpath(posixpath.join(posixpath.dirname(file.src_uri), link))
            if target in by_source and target != file.src_uri:
                edges.add(tuple(sorted((file.src_uri, target))))

    output = Path(config.site_dir) / "graph.json"
    output.write_text(json.dumps({"nodes": nodes, "edges": sorted(edges)}, ensure_ascii=False),
                      encoding="utf-8")
