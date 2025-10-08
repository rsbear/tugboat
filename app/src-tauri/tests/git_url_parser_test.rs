use tugboats_lib::git_url_parser::GitUrl;

#[test]
fn parses_base_repo_no_trailing_slash() {
    let url = "https://github.com/owner/repo";
    let g = GitUrl::parse_https(url).expect("should parse");
    assert_eq!(g.owner(), "owner");
    assert_eq!(g.repo(), "repo");
    assert_eq!(g.branch(), None);
    assert_eq!(g.subpath(), None);
    assert_eq!(g.https_base_url(), "https://github.com/owner/repo");
    assert_eq!(g.ssh_url(), "git@github.com:owner/repo.git");
}

#[test]
fn parses_base_repo_with_trailing_slash() {
    let url = "https://github.com/owner/repo/";
    let g = GitUrl::parse_https(url).expect("should parse");
    assert_eq!(g.owner(), "owner");
    assert_eq!(g.repo(), "repo");
    assert_eq!(g.branch(), None);
    assert_eq!(g.subpath(), None);
}

#[test]
fn parses_base_repo_with_dot_git() {
    let url = "https://github.com/owner/repo.git";
    let g = GitUrl::parse_https(url).expect("should parse");
    assert_eq!(g.owner(), "owner");
    assert_eq!(g.repo(), "repo");
    assert_eq!(g.branch(), None);
    assert_eq!(g.subpath(), None);
}

#[test]
fn parses_tree_branch() {
    let url = "https://github.com/owner/repo/tree/main";
    let g = GitUrl::parse_https(url).expect("should parse");
    assert_eq!(g.owner(), "owner");
    assert_eq!(g.repo(), "repo");
    assert_eq!(g.branch(), Some("main"));
    assert_eq!(g.subpath(), None);
}

#[test]
fn parses_tree_branch_with_subdir() {
    let url = "https://github.com/owner/repo/tree/main/mini-react-ts";
    let g = GitUrl::parse_https(url).expect("should parse");
    assert_eq!(g.owner(), "owner");
    assert_eq!(g.repo(), "repo");
    assert_eq!(g.branch(), Some("main"));
    assert_eq!(g.subpath(), Some("mini-react-ts"));
}

#[test]
fn parses_tree_branch_with_nested_subdir_is_joined() {
    let url = "https://github.com/owner/repo/tree/main/examples/app";
    let g = GitUrl::parse_https(url).expect("should parse");
    assert_eq!(g.branch(), Some("main"));
    assert_eq!(g.subpath(), Some("examples/app"));
}

#[test]
fn errors_on_non_github_https() {
    let url = "https://example.com/owner/repo";
    let err = GitUrl::parse_https(url).unwrap_err();
    assert!(err.contains("https://github.com/"));
}
