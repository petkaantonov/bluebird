module Jekyll
  module MyFilters
    def file_date(input)
      File.mtime(input)
    end

    def check_active(page_path, link_type)
        if (link_type == "support" and page_path =~ /support/) or
            (link_type == "install" and page_path =~ /install/) or
            (link_type == "docs")
            "active"
        else
            ""
        end
    end
  end
end

Liquid::Template.register_filter(Jekyll::MyFilters)
