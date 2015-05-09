require "redcarpet"
require "pygments"
require_relative "../helpers"


class Redcarpet::Render::HTML
    def header(title, level)
        anchor = Helpers.clean(title)

        return <<-eos
            <h#{level}>
                <a class="header-anchor"
                    name="#{anchor}"
                    aria-hidden="true"
                    href="##{anchor}"><i class="fa fa-link"></i></a>
                #{title}
            </h#{level}>
        eos
    end
    # Hacks to get markdown working inside html blocks ....
    def block_html(html)
        html.gsub(/<markdown>([\d\D]+?)<\/markdown>/) {|_|
            extensions = {fenced_code_blocks: true}
            renderer = Redcarpet::Markdown.new(WithHighlights, extensions)
            renderer.render(Regexp.last_match[1])
        }
    end

    def link(link, title, content)
        if link == "."
            if content =~ /#\d+/
                url = "https://github.com/petkaantonov/bluebird/issues/" + content[1..-1]
            else
                url = "/bluebird/web/docs/api-reference.html#" + Helpers.clean(content)
            end
            return <<-eos
                <a href="#{url}"><code>#{content}</code></a>
            eos
        else
            return <<-eos
                <a href="#{link}" title="#{title}">#{content}</a>
            eos
        end
    end
end

class WithHighlights < Redcarpet::Render::HTML
    def block_code(code, language)
        Pygments.highlight(code, :lexer => language)
    end
end
