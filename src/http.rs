//! This module is an adapter for HTTP related operations.
//! In the future, if we want to migrate to a different HTTP library,
//! we can easily change this facade instead of multiple places in the crate.

use reqwest::{blocking::Client, IntoUrl};

#[derive(Debug, thiserror::Error, miette::Diagnostic)]
#[error(transparent)]
#[diagnostic(code("fnm::http::error"))]
pub struct Error(#[from] reqwest::Error);
pub type Response = reqwest::blocking::Response;

pub fn get(url: impl IntoUrl, auth_header: Option<&str>) -> Result<Response, Error> {
    let mut req = client()?
        .get(url)
        // Some sites require a user agent.
        .header("User-Agent", concat!("fnm ", env!("CARGO_PKG_VERSION")));

    if let Some(auth) = auth_header.filter(|s| !s.is_empty()) {
        req = req.header(reqwest::header::AUTHORIZATION, auth);
    }

    Ok(req.send()?)
}

fn client() -> Result<Client, Error> {
    // reqwest is built without a default crypto provider to avoid bundling aws-lc-rs,
    // so we install the smaller `ring` provider. This fails harmlessly if already installed.
    let _ = rustls::crypto::ring::default_provider().install_default();

    // Trust the bundled Mozilla roots in addition to the system store, so fnm
    // keeps working on systems without CA certificates installed (e.g. minimal
    // Docker images), like it did with reqwest 0.12's webpki roots.
    let bundled_roots = webpki_root_certs::TLS_SERVER_ROOT_CERTS
        .iter()
        .filter_map(|cert| reqwest::Certificate::from_der(cert).ok());

    Ok(Client::builder().tls_certs_merge(bundled_roots).build()?)
}
